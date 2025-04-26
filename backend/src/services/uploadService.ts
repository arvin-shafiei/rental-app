import { supabaseAdmin } from './supabase';
import { PropertyService } from './propertyService';
import sharp from 'sharp';

export class UploadService {
  private propertyService: PropertyService;

  constructor() {
    this.propertyService = new PropertyService();
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
    filename: string
  ): Promise<string> {
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
    const basePath = await this.validatePropertyAndBuildPath(userId, propertyId, roomName);
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
  }
  
  /**
   * Process and optimize image
   */
  async optimizeImage(fileBuffer: Buffer): Promise<Buffer> {
    return sharp(fileBuffer)
      .webp({ quality: 80 }) // Optimize image
      .toBuffer();
  }
  
  /**
   * Get public URL for an uploaded file
   */
  getPublicUrl(path: string): string {
    const { data } = supabaseAdmin.storage
      .from('room-media')
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
  
  /**
   * List rooms and images for a property
   */
  async listPropertyImages(propertyId: string, userId: string): Promise<any[]> {
    // Check if the property exists and belongs to the user
    const property = await this.propertyService.getPropertyById(propertyId, userId);
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found or you don't have access to it`);
    }
    
    // The path structure: userId/propertyId/images/
    const baseImagesPath = `${userId}/${propertyId}/images`;
    
    // List all rooms in the images directory
    const { data: roomFolders, error: foldersError } = await supabaseAdmin.storage
      .from('room-media')
      .list(baseImagesPath, {
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (foldersError) {
      throw new Error(`Error listing room folders: ${foldersError.message}`);
    }
    
    // Filter directories (rooms)
    const filteredRoomFolders = roomFolders || [];
    
    // Get images for each room
    const roomsWithImages = await Promise.all(
      filteredRoomFolders.map(async (folder) => {
        const roomName = folder.name;
        
        // Skip non-directory items
        if (!folder || folder.metadata !== null) {
          return null;
        }
        
        // Path structure: userId/propertyId/images/roomName
        const roomPath = `${baseImagesPath}/${roomName}`;
        
        // List all files in the room directory
        const { data: imageFiles, error: imagesError } = await supabaseAdmin.storage
          .from('room-media')
          .list(roomPath, {
            sortBy: { column: 'created_at', order: 'desc' }
          });
        
        if (imagesError) {
          console.error(`Error listing images for room ${roomName}:`, imagesError);
          return {
            roomName,
            images: []
          };
        }
        
        // Filter non-images
        const validImageFiles = imageFiles?.filter(file => 
          file.metadata !== null && 
          typeof file.metadata === 'object' && 
          file.name.match(/\.(jpe?g|png|gif|webp)$/i)
        ) || [];
        
        // Generate URLs for each image
        const images = await Promise.all(validImageFiles.map(async file => {
          const path = `${roomPath}/${file.name}`;
          
          // Create a signed URL that expires in 1 day (86400 seconds)
          const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
            .from('room-media')
            .createSignedUrl(path, 86400);
          
          if (signedUrlError || !signedUrlData) {
            console.error(`Error creating signed URL for ${path}:`, signedUrlError);
            return null;
          }
          
          return {
            filename: file.name,
            path,
            url: signedUrlData.signedUrl,
            metadata: file.metadata,
            created_at: file.created_at
          };
        }));
        
        // Filter out null values (failed to create signed URLs)
        const validImages = images.filter(img => img !== null);
        
        return {
          roomName,
          images: validImages
        };
      })
    );
    
    // Filter out null values and sort rooms
    return roomsWithImages.filter(room => room !== null);
  }
  
  /**
   * Delete an image from Supabase storage
   */
  async deleteImage(propertyId: string, userId: string, imagePath: string): Promise<void> {
    // Check if the property exists and belongs to the user
    const property = await this.propertyService.getPropertyById(propertyId, userId);
    
    if (!property) {
      throw new Error(`Property with ID ${propertyId} not found or you don't have access to it`);
    }
    
    // Verify that the image path starts with the correct user and property ID
    // This is a security check to prevent users from deleting other users' images
    const expectedPathPrefix = `${userId}/${propertyId}/images/`;
    if (!imagePath.startsWith(expectedPathPrefix)) {
      throw new Error('You do not have permission to delete this image');
    }
    
    // Delete the file from Supabase storage
    const { error } = await supabaseAdmin.storage
      .from('room-media')
      .remove([imagePath]);
    
    if (error) {
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }
} 