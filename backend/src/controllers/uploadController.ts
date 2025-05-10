import { Request, Response } from 'express';
import { UploadService } from '../services/uploadService';
import { BaseController } from '../utils/controllerUtils';
import { Logger } from '../utils/loggerUtils';
import * as imageUtils from '../utils/imageUtils';

export class UploadController extends BaseController {
  private uploadService: UploadService;
  private logger: Logger;

  constructor() {
    super();
    this.uploadService = new UploadService();
    this.logger = new Logger('UploadController');
  }

  /**
   * Upload a single image
   */
  async uploadImage(req: Request, res: Response): Promise<void> {
    this.logger.methodStart('uploadImage');
    
    try {
      if (!req.file) {
        this.sendError(res, 'No image file provided', 400);
        return;
      }
      
      // Get property ID and room name from query parameters
      const propertyId = req.query.propertyId as string;
      const roomName = req.query.roomName as string | undefined;
      
      if (!propertyId) {
        this.sendError(res, 'propertyId query parameter is required', 400);
        return;
      }
      
      const userId = this.getUserId(req);
      
      this.logger.info(`Uploading image for property: ${propertyId}, room: ${roomName || 'unspecified'}`);
      
      // Compress file if needed before uploading
      const compressedBuffer = await imageUtils.compressFileIfNeeded(
        req.file.buffer,
        req.file.size,
        req.file.originalname,
        100 * 1024 * 1024 // 100MB limit
      );
      
      // Upload to Supabase storage - pass original filename to preserve extension
      const supabasePath = await this.uploadService.uploadToSupabase(
        compressedBuffer, 
        userId, 
        propertyId, 
        roomName, 
        req.file.originalname
      );
      
      // Get a public URL for the uploaded file
      const publicUrl = this.uploadService.getPublicUrl(supabasePath);
      
      this.logger.info(`Image uploaded successfully at path: ${supabasePath}`);
      this.sendSuccess(res, 'Image uploaded successfully', {
        path: supabasePath,
        url: publicUrl,
        propertyId,
        roomName: roomName || 'unspecified'
      });
    } catch (error: any) {
      this.logger.methodError('uploadImage', error);
      this.sendError(res, 'Error uploading image', 500, error);
    }
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(req: Request, res: Response): Promise<void> {
    this.logger.methodStart('uploadMultipleImages');
    
    try {
      if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
        this.sendError(res, 'No image files provided', 400);
        return;
      }
      
      // Get property ID and room name from query parameters
      const propertyId = req.query.propertyId as string;
      const roomName = req.query.roomName as string | undefined;
      
      if (!propertyId) {
        this.sendError(res, 'propertyId query parameter is required', 400);
        return;
      }
      
      const userId = this.getUserId(req);
      
      this.logger.info(`Uploading ${(req.files as Express.Multer.File[]).length} images for property: ${propertyId}`);
      
      // Process all uploaded files
      const uploadedFiles = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) => {
          try {
            // Compress file if needed before uploading
            const compressedBuffer = await imageUtils.compressFileIfNeeded(
              file.buffer,
              file.size,
              file.originalname,
              100 * 1024 * 1024 // 100MB limit
            );
          
            // Upload to Supabase storage - pass original filename to preserve extension
            const supabasePath = await this.uploadService.uploadToSupabase(
              compressedBuffer, 
              userId, 
              propertyId, 
              roomName, 
              file.originalname
            );
            
            // Get a public URL for the uploaded file
            const publicUrl = this.uploadService.getPublicUrl(supabasePath);
            
            return {
              filename: supabasePath.split('/').pop(),
              path: supabasePath,
              propertyId,
              roomName: roomName || 'unspecified',
              url: publicUrl
            };
          } catch (error) {
            this.logger.error(`Error processing file ${file.originalname}: ${error}`);
            return null;
          }
        })
      );
      
      // Filter out any failed uploads
      const successfulUploads = uploadedFiles.filter(Boolean);
      
      this.logger.info(`Successfully uploaded ${successfulUploads.length} images`);
      this.sendSuccess(res, 'Images uploaded successfully', { files: successfulUploads });
    } catch (error: any) {
      this.logger.methodError('uploadMultipleImages', error);
      this.sendError(res, 'Error uploading images', 500, error);
    }
  }

  /**
   * List property images
   */
  async listPropertyImages(req: Request, res: Response): Promise<void> {
    const propertyId = req.params.propertyId;
    const userId = this.getUserId(req);
    
    this.logger.methodStart('listPropertyImages', { propertyId, userId });
    
    try {
      const rooms = await this.uploadService.listPropertyImages(propertyId, userId);
      
      this.logger.info(`Found ${rooms.length} rooms with images`);
      this.sendSuccess(res, 'Property images retrieved successfully', rooms);
    } catch (error: any) {
      this.logger.methodError('listPropertyImages', error);
      this.sendError(res, 'Error listing property images', 500, error);
    }
  }

  /**
   * Delete an image
   */
  async deleteImage(req: Request, res: Response): Promise<void> {
    const { imagePath } = req.body;
    const propertyId = req.query.propertyId as string;
    const userId = this.getUserId(req);
    
    this.logger.methodStart('deleteImage', { propertyId, imagePath });
    
    try {
      if (!imagePath) {
        this.sendError(res, 'imagePath is required in the request body', 400);
        return;
      }
      
      if (!propertyId) {
        this.sendError(res, 'propertyId query parameter is required', 400);
        return;
      }
      
      await this.uploadService.deleteImage(propertyId, userId, imagePath);
      
      this.logger.info(`Image deleted successfully: ${imagePath}`);
      this.sendSuccess(res, 'Image deleted successfully');
    } catch (error: any) {
      this.logger.methodError('deleteImage', error);
      
      // Get appropriate status code
      const statusCode = this.getErrorStatusCode(error);
      
      this.sendError(res, error.message, statusCode, error);
    }
  }
} 