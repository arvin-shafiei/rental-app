import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import * as imageUtils from '../utils/imageUtils';

const router = Router();

// Test route for generating image URLs
router.get('/test-image-url', authenticateUser, async (req, res) => {
  try {
    const imagePath = req.query.path as string;
    
    if (!imagePath) {
      return res.status(400).json({ success: false, error: 'Image path is required' });
    }
    
    const publicUrl = imageUtils.getPublicUrl(imagePath);
    
    return res.json({ 
      success: true, 
      data: { 
        path: imagePath, 
        url: publicUrl 
      } 
    });
  } catch (error: any) {
    console.error('Error generating image URL:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to generate image URL' 
    });
  }
});

export default router; 