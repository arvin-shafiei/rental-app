import express, { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { analyzeContract } from '../services/openAiService';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { storeContractSummary, getContractSummaries, getContractSummaryById } from '../services/contractService';
import { supabaseAdmin } from '../services/supabase'; // Import supabaseAdmin

dotenv.config();

// Define a custom interface for requests that may include user info
interface RequestWithUser extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '../../uploads/temp');
    // Create directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${uniqueId}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.') as any);
    }
  }
});

const router = express.Router();

// Initialize Supabase client for file operations
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

// Helper function to ensure the storage bucket exists
async function ensureStorageBucketExists() {
  try {
    // Check if the bucket exists
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'room-media');
    
    if (!bucketExists) {
      console.log('Storage bucket "room-media" does not exist. Creating it...');
      
      // Create the bucket if it doesn't exist
      const { data, error } = await supabaseAdmin.storage.createBucket('room-media', {
        public: false,
        fileSizeLimit: 50 * 1024 * 1024, // 50MB file size limit
      });
      
      if (error) {
        console.error('Error creating storage bucket:', error);
      } else {
        console.log('Successfully created storage bucket:', data);
      }
    } else {
      console.log('Storage bucket "room-media" already exists');
    }
  } catch (error) {
    console.error('Error ensuring storage bucket exists:', error);
  }
}

// Add this after router initialization
router.use(async (req, res, next) => {
  // Check for storage bucket on any contract route
  await ensureStorageBucketExists();
  next();
});

/**
 * @route POST /api/contracts/scan
 * @desc Scan a contract document for analysis
 * @access Private
 */
router.post('/scan', upload.single('document'), async (req, res) => {
  try {
    if (!req.file && !req.body.documentPath) {
      return res.status(400).json({
        success: false,
        error: 'No document provided. Please upload a file or provide a document path.'
      });
    }

    // If using an existing document
    if (req.body.documentPath) {
      try {
        console.log(`Processing existing document path: ${req.body.documentPath}`);
        
        // List all available buckets first for debugging
        const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
        if (bucketsError) {
          console.error('Error listing buckets:', bucketsError);
        } else {
          console.log('Available storage buckets (admin):', buckets.map(b => b.name));
        }
        
        // Try listing the root of the user folder to see if it exists
        try {
          const userId = req.body.documentPath.split('/')[0];
          console.log(`Checking if user folder exists: ${userId}`);
          
          const { data: userFiles, error: userError } = await supabaseAdmin.storage
            .from('room-media')
            .list(userId);
            
          if (userError) {
            console.error(`Error listing user folder ${userId}:`, userError);
          } else {
            console.log(`User ${userId} folder contains:`, userFiles);
          }
        } catch (userError) {
          console.error('Error checking user folder:', userError);
        }
        
        // Now try listing the property folder
        try {
          const pathParts = req.body.documentPath.split('/');
          if (pathParts.length >= 2) {
            const userPropertyPath = `${pathParts[0]}/${pathParts[1]}`;
            console.log(`Checking if property folder exists: ${userPropertyPath}`);
            
            const { data: propertyFiles, error: propertyError } = await supabaseAdmin.storage
              .from('room-media')
              .list(userPropertyPath);
              
            if (propertyError) {
              console.error(`Error listing property folder ${userPropertyPath}:`, propertyError);
            } else {
              console.log(`Property folder ${userPropertyPath} contains:`, propertyFiles);
            }
          }
        } catch (propertyError) {
          console.error('Error checking property folder:', propertyError);
        }
        
        // Now try listing the documents folder
        try {
          const pathParts = req.body.documentPath.split('/');
          if (pathParts.length >= 3) {
            const documentsPath = `${pathParts[0]}/${pathParts[1]}/documents`;
            console.log(`Checking if documents folder exists: ${documentsPath}`);
            
            const { data: documentsFiles, error: documentsError } = await supabaseAdmin.storage
              .from('room-media')
              .list(documentsPath);
              
            if (documentsError) {
              console.error(`Error listing documents folder ${documentsPath}:`, documentsError);
            } else {
              console.log(`Documents folder ${documentsPath} contains:`, documentsFiles);
            }
          }
        } catch (docError) {
          console.error('Error checking documents folder:', docError);
        }
        
        // Now check the document type folder
        try {
          const pathParts = req.body.documentPath.split('/');
          if (pathParts.length >= 4) {
            const docTypePath = `${pathParts[0]}/${pathParts[1]}/documents/${pathParts[3]}`;
            console.log(`Checking if document type folder exists: ${docTypePath}`);
            
            const { data: docTypeFiles, error: docTypeError } = await supabaseAdmin.storage
              .from('room-media')
              .list(docTypePath);
              
            if (docTypeError) {
              console.error(`Error listing document type folder ${docTypePath}:`, docTypeError);
            } else {
              console.log(`Document type folder ${docTypePath} contains:`, docTypeFiles);
            }
          }
        } catch (typeError) {
          console.error('Error checking document type folder:', typeError);
        }
        
        // Use supabaseAdmin instead of supabase for privileged storage access
        const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
          .from('room-media')
          .createSignedUrl(req.body.documentPath, 3600); // URL valid for 1 hour
        
        if (signedUrlError || !signedUrlData) {
          console.error('Error creating signed URL for document:', signedUrlError);
          
          // If we get "Object not found" error, attempt to list the directory contents to help debug
          if (signedUrlError?.message?.includes('Object not found')) {
            try {
              const folderPath = req.body.documentPath.split('/').slice(0, -1).join('/');
              console.log(`Attempting to list directory contents at: ${folderPath}`);
              
              const { data: files, error: listError } = await supabaseAdmin.storage
                .from('room-media')
                .list(folderPath);
                
              if (listError) {
                console.error(`Error listing directory contents at ${folderPath}:`, listError);
              } else {
                console.log(`Directory contents at ${folderPath}:`, files);
              }
            } catch (listError) {
              console.error('Error while attempting to list directory contents:', listError);
            }
          }
          
          return res.status(404).json({
            success: false,
            error: 'Document not found or could not be accessed'
          });
        }
        
        console.log('Successfully created signed URL:', signedUrlData.signedUrl);
        
        // Now download the file using the signed URL
        const fileResponse = await fetch(signedUrlData.signedUrl);
        
        if (!fileResponse.ok) {
          console.error('Error downloading document:', fileResponse.statusText);
          return res.status(404).json({
            success: false,
            error: 'Document could not be downloaded'
          });
        }
        
        // Convert to buffer
        const fileBuffer = await fileResponse.arrayBuffer();
        
        // Analyze the contract using OpenAI
        const analysis = await analyzeContract(Buffer.from(fileBuffer));
        
        // Store the analysis result in the database
        try {
          // Get userId from the request if available
          const userId = (req as RequestWithUser).user?.id;
          await storeContractSummary(analysis, userId);
        } catch (storageError) {
          console.warn('Failed to store summary, but continuing:', storageError);
          // Continue execution even if storage fails
        }
        
        return res.status(200).json({
          success: true,
          data: analysis
        });
      } catch (error: any) {
        console.error('Error analyzing existing document:', error);
        return res.status(500).json({
          success: false,
          error: `Error analyzing document: ${error.message || 'Unknown error'}`
        });
      }
    }

    // If uploading a new document
    if (req.file) {
      try {
        console.log(`Processing uploaded file: ${req.file.originalname} (${req.file.path})`);
        
        // Analyze the uploaded contract
        const analysis = await analyzeContract(req.file.path);
        
        // Store the analysis result in the database
        try {
          // Get userId from the request if available  
          const userId = (req as RequestWithUser).user?.id;
          await storeContractSummary(analysis, userId);
        } catch (storageError) {
          console.warn('Failed to store summary, but continuing:', storageError);
          // Continue execution even if storage fails
        }
        
        // Clean up temporary file
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting temporary file:', err);
        });
        
        return res.status(200).json({
          success: true,
          data: analysis
        });
      } catch (error: any) {
        console.error('Error analyzing uploaded document:', error);
        
        // Clean up temporary file
        if (req.file) {
          fs.unlink(req.file.path, (err) => {
            if (err) console.error('Error deleting temporary file:', err);
          });
        }
        
        return res.status(500).json({
          success: false,
          error: `Error analyzing document: ${error.message || 'Unknown error'}`
        });
      }
    }
    
    // This should never happen since we check for req.file and req.body.documentPath above
    return res.status(400).json({
      success: false,
      error: 'No document provided or unsupported document type.'
    });
  } catch (error: any) {
    console.error('Error in contract scan route:', error);
    
    // Always clean up temporary file if it exists
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temporary file:', err);
      });
    }
    
    return res.status(500).json({
      success: false,
      error: `Unexpected error: ${error.message || 'Unknown error'}`
    });
  }
});

/**
 * @route GET /api/contracts/summaries
 * @desc Get contract analysis summaries with pagination
 * @access Private
 */
router.get('/summaries', async (req: RequestWithUser, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Get the user ID from the authenticated session or query param
    const userId = req.user?.id || req.query.userId as string;
    
    const summaries = await getContractSummaries(userId, limit, offset);
    
    return res.status(200).json({
      success: true,
      data: summaries
    });
  } catch (error: any) {
    console.error('Error fetching contract summaries:', error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch contract summaries: ${error.message || 'Unknown error'}`
    });
  }
});

/**
 * @route GET /api/contracts/summaries/:id
 * @desc Get a specific contract summary by ID
 * @access Private
 */
router.get('/summaries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const summary = await getContractSummaryById(id);
    
    if (!summary) {
      return res.status(404).json({
        success: false,
        error: 'Contract summary not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    console.error(`Error fetching contract summary with ID ${req.params.id}:`, error);
    return res.status(500).json({
      success: false,
      error: `Failed to fetch contract summary: ${error.message || 'Unknown error'}`
    });
  }
});

export default router; 