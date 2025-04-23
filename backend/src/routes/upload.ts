import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser } from '../middleware/auth';
import sharp from 'sharp';
import { supabase } from '../services/supabase';

// Initialize router
const router = Router();

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

// Upload image to Supabase Storage
const uploadToSupabase = async (
  fileBuffer: Buffer, 
  userId: string, 
  filename: string
): Promise<string> => {
  // Check if the bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError || !buckets) {
    throw new Error(`Failed to check storage buckets: ${listError?.message || 'No buckets data returned'}`);
  }
  
  const bucketExists = buckets.some(bucket => bucket.name === 'room-media');
  
  if (!bucketExists) {
    throw new Error('Storage bucket "room-media" does not exist');
  }
  
  // Upload the file to Supabase storage
  const { data, error } = await supabase.storage
    .from('room-media')
    .upload(`${userId}/${filename}`, fileBuffer, {
      contentType: 'image/webp',
      upsert: false
    });
  
  if (error) throw new Error(`Failed to upload to Supabase: ${error.message}`);
  
  return data.path;
};

// Upload single image
router.post('/image', authenticateUser, upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
      return;
    }
    
    const user = (req as any).user;
    const userId = user.id;
    
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    const filename = `${timestamp}-${uniqueId}.webp`;
    
    // Process image with sharp (convert to webp for consistency and optimization)
    const optimizedImageBuffer = await sharp(req.file.buffer)
      .webp({ quality: 80 }) // Optimize image
      .toBuffer();
    
    // Upload to Supabase storage
    const supabasePath = await uploadToSupabase(optimizedImageBuffer, userId, filename);
    
    // Get a public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('room-media')
      .getPublicUrl(`${userId}/${filename}`);
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename,
        timestamp,
        path: supabasePath,
        url: publicUrlData.publicUrl
      }
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// Upload multiple images
router.post('/images', authenticateUser, upload.array('images', 10), async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
      return;
    }
    
    const user = (req as any).user;
    const userId = user.id;
    
    // Process all uploaded files
    const uploadedFiles = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const uniqueId = uuidv4();
        const filename = `${timestamp}-${uniqueId}.webp`;
        
        // Process image with sharp
        const optimizedImageBuffer = await sharp(file.buffer)
          .webp({ quality: 80 })
          .toBuffer();
        
        // Upload to Supabase storage
        const supabasePath = await uploadToSupabase(optimizedImageBuffer, userId, filename);
        
        // Get a public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from('room-media')
          .getPublicUrl(`${userId}/${filename}`);
        
        return {
          filename,
          timestamp,
          path: supabasePath,
          url: publicUrlData.publicUrl
        };
      })
    );
    
    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        files: uploadedFiles
      }
    });
  } catch (error: any) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
});

export default router; 