import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { UploadService } from '../services/uploadService';

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  /**
   * Upload a single image
   */
  async uploadImage(req: Request, res: Response): Promise<void> {
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
      const optimizedImageBuffer = await this.uploadService.optimizeImage(req.file.buffer);
      
      // Upload to Supabase storage
      const supabasePath = await this.uploadService.uploadToSupabase(
        optimizedImageBuffer, 
        userId, 
        propertyId, 
        roomName, 
        filename
      );
      
      // Get a public URL for the uploaded file
      const publicUrl = this.uploadService.getPublicUrl(supabasePath);
      
      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          filename,
          timestamp,
          path: supabasePath,
          propertyId,
          roomName: roomName || 'unspecified',
          url: publicUrl
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
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(req: Request, res: Response): Promise<void> {
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
          const optimizedImageBuffer = await this.uploadService.optimizeImage(file.buffer);
          
          // Upload to Supabase storage
          const supabasePath = await this.uploadService.uploadToSupabase(
            optimizedImageBuffer, 
            userId, 
            propertyId, 
            roomName, 
            filename
          );
          
          // Get a public URL for the uploaded file
          const publicUrl = this.uploadService.getPublicUrl(supabasePath);
          
          return {
            filename,
            timestamp,
            path: supabasePath,
            propertyId,
            roomName: roomName || 'unspecified',
            url: publicUrl
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
  }

  /**
   * List property images
   */
  async listPropertyImages(req: Request, res: Response): Promise<void> {
    try {
      const propertyId = req.params.propertyId;
      const user = (req as any).user;
      const userId = user.id;
      
      const rooms = await this.uploadService.listPropertyImages(propertyId, userId);
      
      res.status(200).json({
        success: true,
        data: rooms
      });
    } catch (error: any) {
      console.error('Error listing property images:', error);
      res.status(500).json({
        success: false,
        message: 'Error listing property images',
        error: error.message
      });
    }
  }

  /**
   * Delete an image
   */
  async deleteImage(req: Request, res: Response): Promise<void> {
    try {
      const { imagePath } = req.body;
      const propertyId = req.query.propertyId as string;
      
      if (!imagePath) {
        res.status(400).json({
          success: false,
          message: 'imagePath is required in the request body'
        });
        return;
      }
      
      if (!propertyId) {
        res.status(400).json({
          success: false,
          message: 'propertyId query parameter is required'
        });
        return;
      }
      
      const user = (req as any).user;
      const userId = user.id;
      
      await this.uploadService.deleteImage(propertyId, userId, imagePath);
      
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting image:', error);
      
      // Determine the appropriate status code based on the error message
      let statusCode = 500;
      if (error.message.includes("not found") || error.message.includes("don't have access")) {
        statusCode = 404;
      } else if (error.message.includes("permission to delete")) {
        statusCode = 403;
      }
      
      res.status(statusCode).json({
        success: false,
        message: 'Error deleting image',
        error: error.message
      });
    }
  }
} 