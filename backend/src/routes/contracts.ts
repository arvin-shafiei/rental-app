import express, { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { analyzeContract } from '../services/openAiService';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { storeContractSummary, getContractSummaries, getContractSummaryById } from '../services/contractService';

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
        console.log(`Processing existing document: ${req.body.documentPath}`);
        
        // Get the document from Supabase
        const { data: fileData, error: fileError } = await supabase
          .storage
          .from('documents')
          .download(req.body.documentPath);
        
        if (fileError || !fileData) {
          console.error('Error fetching document from Supabase:', fileError);
          return res.status(404).json({
            success: false,
            error: 'Document not found or could not be accessed'
          });
        }
        
        // Analyze the contract using OpenAI
        const buffer = await fileData.arrayBuffer();
        const analysis = await analyzeContract(Buffer.from(buffer));
        
        // Store the analysis result in the database
        try {
          await storeContractSummary(analysis);
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
          await storeContractSummary(analysis);
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