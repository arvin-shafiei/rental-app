import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateUser } from '../middleware/auth';
import { DocumentController } from '../controllers/documentController';

// Initialize router
const router = Router();

// Initialize controller
const documentController = new DocumentController();

// Set up multer for handling file uploads
// We'll store files temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // limit file size to 10MB
  },
  fileFilter: (_req, file, callback) => {
    // Accept document files
    const filetypes = /pdf|doc|docx|xls|xlsx|txt|csv|ppt|pptx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return callback(null, true);
    }
    callback(new Error("Only document files are allowed!"));
  }
});

// Detailed logging middleware for document routes
router.use((req, res, next) => {
  console.log(`[Documents API] Processing ${req.method} ${req.path}`);
  next();
});

// Upload single document
router.post(
  '/upload',
  (req, res, next) => {
    console.log('[Documents API] Attempting to authenticate user for POST /upload');
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log('[Documents API] User authenticated successfully, proceeding to upload document');
    next();
  },
  upload.single('document'),
  documentController.uploadDocument.bind(documentController)
);

// Upload multiple documents
router.post(
  '/upload-multiple',
  (req, res, next) => {
    console.log('[Documents API] Attempting to authenticate user for POST /upload-multiple');
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log('[Documents API] User authenticated successfully, proceeding to upload multiple documents');
    next();
  },
  upload.array('documents', 10),
  documentController.uploadMultipleDocuments.bind(documentController)
);

// List documents for a property
router.get(
  '/property/:propertyId',
  (req, res, next) => {
    console.log(`[Documents API] Attempting to authenticate user for GET /property/${req.params.propertyId}`);
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log(`[Documents API] User authenticated successfully, proceeding to list documents for property ID: ${req.params.propertyId}`);
    next();
  },
  documentController.listPropertyDocuments.bind(documentController)
);

// Delete a document
router.delete(
  '/:documentPath(*)',
  (req, res, next) => {
    console.log(`[Documents API] Attempting to authenticate user for DELETE document`);
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log(`[Documents API] User authenticated successfully, proceeding to delete document`);
    next();
  },
  documentController.deleteDocument.bind(documentController)
);

export default router; 