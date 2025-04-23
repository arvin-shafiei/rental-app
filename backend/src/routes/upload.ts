import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateUser } from '../middleware/auth';
import sharp from 'sharp';
import { supabaseAdmin } from '../services/supabase';
import { PropertyService } from '../services/propertyService';

// Initialize router
const router = Router();
const propertyService = new PropertyService();

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

// Validate property access and build path
const validatePropertyAndBuildPath = async (
  userId: string, 
  propertyId: string, 
  roomName?: string
): Promise<string> => {
  // Check if the property exists and belongs to the user
  const property = await propertyService.getPropertyById(propertyId, userId);
  
  if (!property) {
    throw new Error(`Property with ID ${propertyId} not found or you don't have access to it`);
  }
  
  // Build path: userId/propertyId/roomName/images/
  let storagePath = `${userId}/${propertyId}/`;
  
  if (roomName) {
    // Sanitize room name (remove spaces, special chars)
    const sanitizedRoomName = roomName
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
      
    storagePath += `${sanitizedRoomName}/`;
  }
  
  storagePath += 'images/';
  
  return storagePath;
};

// Upload image to Supabase Storage using service role
const uploadToSupabase = async (
  fileBuffer: Buffer, 
  userId: string, 
  propertyId: string,
  roomName: string | undefined,
  filename: string
): Promise<string> => {
  // Check if the bucket exists using service role client
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  
  if (listError || !buckets) {
    throw new Error(`Failed to check storage buckets: ${listError?.message || 'No buckets data returned'}`);
  }
  
  const bucketExists = buckets.some(bucket => bucket.name === 'room-media');
  
  if (!bucketExists) {
    throw new Error('Storage bucket "room-media" does not exist');
  }
  
  // Get the storage path with property validation
  const basePath = await validatePropertyAndBuildPath(userId, propertyId, roomName);
  const fullPath = `${basePath}${filename}`;
  
  // Upload the file to Supabase storage using service role client
  const { data, error } = await supabaseAdmin.storage
    .from('room-media')
    .upload(fullPath, fileBuffer, {
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
    
    // Get property ID and room name from query parameters
    const propertyId = req.query.propertyId as string;
    const roomName = req.query.roomName as string | undefined;
    
    if (!propertyId) {
      res.status(400).json({
        success: false,
        message: 'propertyId query parameter is required'
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
    
    // Upload to Supabase storage using service role
    const supabasePath = await uploadToSupabase(
      optimizedImageBuffer, 
      userId, 
      propertyId, 
      roomName, 
      filename
    );
    
    // Get a public URL for the uploaded file using service role
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('room-media')
      .getPublicUrl(supabasePath);
    
    res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename,
        timestamp,
        path: supabasePath,
        propertyId,
        roomName: roomName || 'unspecified',
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
    
    // Get property ID and room name from query parameters
    const propertyId = req.query.propertyId as string;
    const roomName = req.query.roomName as string | undefined;
    
    if (!propertyId) {
      res.status(400).json({
        success: false,
        message: 'propertyId query parameter is required'
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
        
        // Upload to Supabase storage using service role
        const supabasePath = await uploadToSupabase(
          optimizedImageBuffer, 
          userId, 
          propertyId, 
          roomName, 
          filename
        );
        
        // Get a public URL for the uploaded file using service role
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('room-media')
          .getPublicUrl(supabasePath);
        
        return {
          filename,
          timestamp,
          path: supabasePath,
          propertyId,
          roomName: roomName || 'unspecified',
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