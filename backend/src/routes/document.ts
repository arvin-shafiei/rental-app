import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateUser } from '../middleware/auth';
import { DocumentController } from '../controllers/documentController';
import { incrementFeatureUsage } from '../utils/usageTrackingUtils';

// Initialize router
const router = Router();

// Initialize controller
const documentController = new DocumentController();

// Middleware to track feature usage
const trackUsage = async (req: any, res: any, next: () => void) => {
  // Store the original send function
  const originalSend = res.send;
  
  // Override the send function
  res.send = function(body: any) {
    // Parse the response body if it's a string
    const responseBody = typeof body === 'string' ? JSON.parse(body) : body;
    
    // Check if the upload was successful
    if (res.statusCode >= 200 && res.statusCode < 300 && responseBody.success) {
      // Get the user ID from the authenticated user
      const userId = req.user?.id;
      
      if (userId) {
        // Track document usage directly
        incrementFeatureUsage(userId, 'documents')
          .then((success) => {
            if (success) {
              console.log(`[Usage Tracking] Incremented document usage for user ${userId}`);
            }
          })
          .catch(err => console.error('[Usage Tracking] Failed to increment document usage:', err));
      }
    }
    
    // Call the original send function
    return originalSend.call(this, body);
  };
  
  next();
};

// Set up multer for handling file uploads
// We'll store files temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // increased limit to 25MB
  },
  fileFilter: (_req, file, callback) => {
    // Accept document files
    // const filetypes = /pdf|doc|docx|xls|xlsx|txt|csv|ppt|pptx/;
    // const mimetype = filetypes.test(file.mimetype);
    // const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    // if (mimetype && extname) {
    //   return callback(null, true);
    // }
    // callback(new Error("Only document files are allowed!"));

    callback(null, true);
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
  trackUsage,
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
  trackUsage,
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