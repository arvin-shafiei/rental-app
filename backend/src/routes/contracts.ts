import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { analyzeContract } from '../services/openAiService';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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

export default router; 