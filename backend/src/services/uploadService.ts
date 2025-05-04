import { supabaseAdmin } from './supabase';
import { PropertyService } from './propertyService';
import { Logger } from '../utils/loggerUtils';
import * as imageUtils from '../utils/imageUtils';

export class UploadService {
  private propertyService: PropertyService;
  private logger: Logger;

  constructor() {
    this.propertyService = new PropertyService();
    this.logger = new Logger('UploadService');
  }

  /**
   * Validate property access and build path
   */
  async validatePropertyAndBuildPath(
    userId: string, 
    propertyId: string, 
    roomName?: string
  ): Promise<string> {
    // Check if the property exists and belongs to the user
    const property = await this.propertyService.getPropertyById(propertyId, userId);
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found or you don't have access to it`);
    }
    
    // Build path: userId/propertyId/images/roomName/
    let storagePath = `${userId}/${propertyId}/images/`;
    
    if (roomName) {
      // Sanitize room name (remove spaces, special chars)
      const sanitizedRoomName = roomName
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
        
      storagePath += `${sanitizedRoomName}/`;
    } else {
      // If no room name specified, use 'unspecified' as folder
      storagePath += 'unspecified/';
    }
    
    return storagePath;
  }
  
  /**
   * Upload image to Supabase Storage
   */
  async uploadToSupabase(
    fileBuffer: Buffer, 
    userId: string, 
    propertyId: string,
    roomName: string | undefined,
    originalFilename: string
  ): Promise<string> {
    this.logger.methodStart('uploadToSupabase', { 
      userId,
      propertyId,
      roomName,
      originalFilename,
      fileSize: fileBuffer.length
    });
    
    try {
      // Get the storage path with property validation
      const storagePath = await imageUtils.validatePropertyAndBuildPath(userId, propertyId, 'images', roomName);
      
      // Optimize image
      const optimizedImageBuffer = await imageUtils.optimizeImage(fileBuffer);
      
      // Generate unique filename
      const filename = imageUtils.generateUniqueFilename(originalFilename);
      
      // Upload to Supabase
      const path = await imageUtils.uploadToSupabase(
        optimizedImageBuffer,
        storagePath,
        filename,
        'image/webp'
      );
      
      this.logger.info(`Image uploaded successfully at path: ${path}`);
      return path;
    } catch (error: any) {
      this.logger.methodError('uploadToSupabase', error);
      throw error;
    }
  }
  
  /**
   * Get public URL for an uploaded file
   */
  getPublicUrl(path: string): string {
    return imageUtils.getPublicUrl(path);
  }
  
  /**
   * List rooms and images for a property
   */
  async listPropertyImages(propertyId: string, userId: string): Promise<any[]> {
    this.logger.methodStart('listPropertyImages', { propertyId, userId });
    
    try {
      return await imageUtils.listPropertyImages(propertyId, userId);
    } catch (error: any) {
      this.logger.methodError('listPropertyImages', error);
      throw error;
    }
  }
  
  /**
   * Delete an image from Supabase storage
   */
  async deleteImage(propertyId: string, userId: string, imagePath: string): Promise<void> {
    this.logger.methodStart('deleteImage', { propertyId, userId, imagePath });
    
    try {
      await imageUtils.deleteFileFromStorage(imagePath, userId, propertyId);
      this.logger.info(`Image deleted successfully: ${imagePath}`);
    } catch (error: any) {
      this.logger.methodError('deleteImage', error);
      throw error;
    }
  }
} 