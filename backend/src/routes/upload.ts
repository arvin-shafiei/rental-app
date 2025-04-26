import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateUser } from '../middleware/auth';
import { UploadController } from '../controllers/uploadController';

// Initialize router
const router = Router();

// Initialize controller
const uploadController = new UploadController();

// Set up multer for handling file uploads
// We'll store files temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // limit file size to 5MB
  },
  fileFilter: (_req, file, callback) => {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return callback(null, true);
    }
    callback(new Error("Only image files are allowed!"));
  }
});

// Upload single image
router.post(
  '/image', 
  authenticateUser, 
  upload.single('image'), 
  uploadController.uploadImage.bind(uploadController)
);

// Upload multiple images
router.post(
  '/images', 
  authenticateUser, 
  upload.array('images', 10), 
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