import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateUser } from '../middleware/auth';
import { UploadController } from '../controllers/uploadController';
import { incrementFeatureUsage } from '../utils/usageTrackingUtils';

// Initialize router
const router = Router();

// Initialize controller
const uploadController = new UploadController();

// Middleware to track feature usage
const trackImageUsage = async (req: any, res: any, next: () => void) => {
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
        // Track image usage directly
        incrementFeatureUsage(userId, 'images')
          .then((success) => {
            if (success) {
              console.log(`[Usage Tracking] Incremented image usage for user ${userId}`);
            }
          })
          .catch(err => console.error('[Usage Tracking] Failed to increment image usage:', err));
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
    fileSize: 100 * 1024 * 1024, // limit file size to 100MB
  },
  fileFilter: (_req, file, callback) => {
    // Accept only image files and videos
    const filetypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return callback(null, true);
    }
    callback(new Error("Only image and video files are allowed!"));
  }
});

// Upload single image
router.post(
  '/image', 
  authenticateUser, 
  upload.single('image'), 
  trackImageUsage,
  uploadController.uploadImage.bind(uploadController)
);

// Upload multiple images
router.post(
  '/images', 
  authenticateUser, 
  upload.array('images', 10), 
  trackImageUsage,
  uploadController.uploadMultipleImages.bind(uploadController)
);

// List rooms and images for a property
router.get(
  '/property/:propertyId/images', 
  authenticateUser, 
  uploadController.listPropertyImages.bind(uploadController)
);

// Delete an image
router.delete(
  '/image', 
  authenticateUser, 
  uploadController.deleteImage.bind(uploadController)
);

export default router; 