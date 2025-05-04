import axios from 'axios';
import { supabaseAdmin } from '../services/supabase';
import sharp from 'sharp';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PropertyService } from '../services/propertyService';
import { Logger } from './loggerUtils';

// Initialize logger
const logger = new Logger('ImageUtils');

/**
 * Validate property access and build storage path
 */
export async function validatePropertyAndBuildPath(
  userId: string,
  propertyId: string,
  folderType: 'images' | 'documents' = 'images', 
  subFolderName?: string
): Promise<string> {
  logger.methodStart('validatePropertyAndBuildPath', { 
    userId, 
    propertyId, 
    folderType,
    subFolderName 
  });
  
  // Create property service instance
  const propertyService = new PropertyService();
  
  // Check if the property exists and belongs to the user
  const property = await propertyService.getPropertyById(propertyId, userId);
  
  if (!property) {
    throw new Error(`Property with ID ${propertyId} not found or you don't have access to it`);
  }
  
  // Build path: userId/propertyId/images|documents/subFolderName/
  let storagePath = `${userId}/${propertyId}/${folderType}/`;
  
  if (subFolderName) {
    // Sanitize folder name (remove spaces, special chars)
    const sanitizedName = subFolderName
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
      
    storagePath += `${sanitizedName}/`;
  } else {
    // If no subfolder name specified, use default
    storagePath += folderType === 'images' ? 'unspecified/' : 'general/';
  }
  
  logger.info(`Built storage path: ${storagePath}`);
  return storagePath;
}

/**
 * Process and optimize image
 */
export async function optimizeImage(fileBuffer: Buffer, options = { quality: 80 }): Promise<Buffer> {
  return sharp(fileBuffer)
    .webp({ quality: options.quality }) // Optimize image
    .toBuffer();
}

/**
 * Generate unique filename for upload
 */
export function generateUniqueFilename(originalFilename: string, maxLength: number = 40): string {
  // Keep original file extension
  const fileExt = path.extname(originalFilename);
  
  // Generate unique filename with timestamp but preserve extension
  const timestamp = Date.now();
  const uniqueId = uuidv4().substring(0, 8);
  const sanitizedName = path.basename(originalFilename, fileExt)
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, '-')
    .substring(0, maxLength); // Limit name length
    
  return `${sanitizedName}-${timestamp}-${uniqueId}${fileExt}`;
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadToSupabase(
  fileBuffer: Buffer, 
  storagePath: string,
  filename: string,
  contentType: string,
  bucketName: string = 'room-media'
): Promise<string> {
  logger.methodStart('uploadToSupabase', { 
    storagePath,
    filename,
    contentType,
    bucketName,
    fileSize: fileBuffer.length
  });
  
  // Check if the bucket exists using service role client
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  
  if (listError || !buckets) {
    logger.error(`Failed to check storage buckets: ${listError?.message || 'No buckets data returned'}`);
    throw new Error(`Failed to check storage buckets: ${listError?.message || 'No buckets data returned'}`);
  }
  
  const bucketExists = buckets.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    logger.error(`Storage bucket "${bucketName}" does not exist`);
    throw new Error(`Storage bucket "${bucketName}" does not exist`);
  }
  
  const fullPath = `${storagePath}${filename}`;
  
  logger.info(`Uploading file to Supabase storage at: ${fullPath}`);
  
  // Upload the file to Supabase storage using service role client
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(fullPath, fileBuffer, {
      contentType,
      upsert: false
    });
  
  if (error) {
    logger.error(`Failed to upload to Supabase: ${error.message}`);
    throw new Error(`Failed to upload to Supabase: ${error.message}`);
  }
  
  logger.info(`File uploaded successfully at: ${data.path}`);
  return data.path;
}

/**
 * Get public URL for an uploaded file
 */
export function getPublicUrl(path: string, bucketName: string = 'room-media'): string {
  const { data } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

/**
 * Delete a file from Supabase storage
 */
export async function deleteFileFromStorage(
  filePath: string, 
  userId: string, 
  propertyId: string, 
  bucketName: string = 'room-media'
): Promise<void> {
  logger.methodStart('deleteFileFromStorage', { filePath, userId, propertyId, bucketName });
  
  // Verify that the image path starts with the correct user and property ID
  // This is a security check to prevent users from deleting other users' files
  const expectedPathPrefix = `${userId}/${propertyId}/`;
  if (!filePath.startsWith(expectedPathPrefix)) {
    logger.error(`Security check failed: path ${filePath} does not start with expected prefix ${expectedPathPrefix}`);
    throw new Error('You do not have permission to delete this file');
  }
  
  // Delete the file from Supabase storage
  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .remove([filePath]);
  
  if (error) {
    logger.error(`Failed to delete file: ${error.message}`);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
  
  logger.info(`File deleted successfully: ${filePath}`);
}

/**
 * Fetch property images from database
 */
export async function fetchPropertyImages(imageIds: string[], propertyId: string): Promise<any[]> {
  logger.methodStart('fetchPropertyImages', { imageIds, propertyId });
  
  try {
    // Fetch property images
    const { data: images, error } = await supabaseAdmin
      .from('property_images')
      .select('*')
      .in('id', imageIds)
      .eq('property_id', propertyId);
    
    if (error) {
      logger.error(`Error fetching images: ${error.message}`);
      return [];
    }
    
    if (!images || images.length === 0) {
      logger.info(`No images found in property_images table`);
      return [];
    }
    
    logger.info(`Found ${images.length} images in database`);
    
    return images.map(image => ({
      id: image.id,
      filename: image.filename,
      path: image.path,
      url: image.url
    }));
  } catch (error: any) {
    logger.error(`Error in fetchPropertyImages: ${error.message}`);
    return [];
  }
}

/**
 * List all images for a property
 */
export async function listPropertyImages(propertyId: string, userId: string): Promise<any[]> {
  logger.methodStart('listPropertyImages', { propertyId, userId });
  
  try {
    // Create property service instance
    const propertyService = new PropertyService();
    
    // Check if the property exists and belongs to the user
    const property = await propertyService.getPropertyById(propertyId, userId);
    
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
      logger.error(`Error listing room folders: ${foldersError.message}`);
      throw new Error(`Error listing room folders: ${foldersError.message}`);
    }
    
    // Filter directories (rooms)
    const filteredRoomFolders = roomFolders || [];
    
    logger.info(`Found ${filteredRoomFolders.length} room folders`);
    
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
        
        logger.info(`Listing images in room: ${roomPath}`);
        
        // List all files in the room directory
        const { data: imageFiles, error: imagesError } = await supabaseAdmin.storage
          .from('room-media')
          .list(roomPath, {
            sortBy: { column: 'created_at', order: 'desc' }
          });
        
        if (imagesError) {
          logger.error(`Error listing images for room ${roomName}: ${imagesError.message}`);
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
        
        logger.info(`Found ${validImageFiles.length} images in room ${roomName}`);
        
        // Generate URLs for each image
        const images = await Promise.all(validImageFiles.map(async file => {
          const path = `${roomPath}/${file.name}`;
          
          // Create a signed URL that expires in 1 day (86400 seconds)
          const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
            .from('room-media')
            .createSignedUrl(path, 86400);
          
          if (signedUrlError || !signedUrlData) {
            logger.error(`Error creating signed URL for ${path}: ${signedUrlError?.message}`);
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
    
    // Filter out null values
    const result = roomsWithImages.filter(room => room !== null);
    logger.info(`Returning ${result.length} rooms with images`);
    
    return result;
  } catch (error: any) {
    logger.error(`Error in listPropertyImages: ${error.message}`);
    throw error;
  }
}

/**
 * Prepare image attachments for email
 */
export async function prepareImageAttachments(imageIds: string[], propertyId: string): Promise<any[]> {
  logger.methodStart('prepareImageAttachments', { imageIds, propertyId });
  
  try {
    if (!imageIds || imageIds.length === 0) {
      logger.info('No image IDs provided for attachments');
      return [];
    }
    
    // Filter out any null or invalid image IDs
    const validImageIds = imageIds.filter(id => id !== null && id !== undefined);
    if (validImageIds.length === 0) {
      logger.info('No valid image IDs after filtering');
      return [];
    }
    
    // Get image metadata from the database using our helper method
    const images = await fetchPropertyImages(validImageIds, propertyId);
    
    if (!images || images.length === 0) {
      logger.info('No images found in database, trying direct storage access');
      return await fetchRoomMediaImages(validImageIds, propertyId);
    }
    
    logger.info(`Processing ${images.length} images for email attachments`);
    
    // Download each image and prepare as attachment
    const downloadPromises = images.map(async (image) => {
      try {
        // Get the path components
        const pathParts = image.path.split('/');
        const bucket = 'property-images';
        const path = image.path;
        
        logger.info(`Downloading image from path: ${path}`);
        
        // Download file from storage
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .download(path);
        
        if (error) {
          logger.error(`Error downloading image ${image.id}: ${error.message}`);
          return null;
        }
        
        if (!data) {
          logger.error(`No data returned when downloading image ${image.id}`);
          return null;
        }
        
        // Convert to Buffer if needed
        let buffer: Buffer;
        if (data instanceof ArrayBuffer) {
          buffer = Buffer.from(data);
        } else if (data instanceof Blob) {
          // Convert Blob to Buffer
          const arrayBuffer = await data.arrayBuffer();
          buffer = Buffer.from(arrayBuffer);
        } else {
          buffer = data as Buffer;
        }
        
        // Create filename from path
        const filename = path.split('/').pop() || `image-${Date.now()}.jpg`;
        
        logger.info(`Successfully downloaded image ${image.id} (${buffer.byteLength} bytes)`);
        
        return {
          filename,
          content: buffer
        };
      } catch (error: any) {
        logger.error(`Error processing image ${image.id}: ${error.message}`);
        return null;
      }
    });
    
    const downloadedImages = (await Promise.all(downloadPromises)).filter(Boolean);
    
    logger.info(`Successfully downloaded ${downloadedImages.length} images`);
    
    if (downloadedImages.length === 0) {
      logger.info('Failed to download any images, trying room-media direct access');
      return await fetchRoomMediaImages(validImageIds, propertyId);
    }
    
    // Create individual attachments for each image
    const attachments = downloadedImages.map(image => ({
      filename: image?.filename,
      content: image?.content
    }));
    
    logger.info(`Returning ${attachments.length} individual image attachments`);
    return attachments;
  } catch (error: any) {
    logger.error(`Error preparing attachments: ${error.message}`);
    return [];
  }
}

/**
 * Fetch images directly from room-media storage
 * This is a fallback if property_images table doesn't have the data
 */
export async function fetchRoomMediaImages(imageIds: string[], propertyId: string): Promise<any[]> {
  logger.methodStart('fetchRoomMediaImages', { imageIds, propertyId });
  
  try {
    // Get property details to find user ID
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select('user_id')
      .eq('id', propertyId)
      .single();
    
    if (propertyError || !property) {
      logger.error(`Error fetching property for user ID: ${propertyError?.message || 'Property not found'}`);
      return [];
    }
    
    const userId = property.user_id;
    
    // Base path for images
    const basePath = `${userId}/${propertyId}/images`;
    
    // List all room folders
    const { data: roomFolders, error: foldersError } = await supabaseAdmin.storage
      .from('room-media')
      .list(basePath);
    
    if (foldersError) {
      logger.error(`Error listing room folders: ${foldersError.message}`);
      return [];
    }
    
    // Create an array to store found images
    const foundImages = [];
    
    // For each image ID (which might be a filename without extension)
    for (const imageId of imageIds) {
      let imageFound = false;
      
      // Normalize ID for search - remove any UUID prefix
      const searchId = imageId.includes('_') 
        ? imageId.split('_')[1] // Take part after first underscore
        : imageId;
      
      logger.info(`Looking for image with searchId: ${searchId}`);
      
      // For each room folder, search for this image
      for (const folder of roomFolders || []) {
        if (!folder.name || folder.name === '.emptyFolderPlaceholder') continue;
        
        // List files in this room folder
        const folderPath = `${basePath}/${folder.name}`;
        const { data: files, error: filesError } = await supabaseAdmin.storage
          .from('room-media')
          .list(folderPath);
        
        if (filesError) {
          logger.error(`Error listing files in ${folderPath}: ${filesError.message}`);
          continue;
        }
        
        // Find a file that matches this image ID
        const matchingFile = files?.find(file => {
          if (!file.name) return false;
          
          // Check if filename contains our search ID (could be part of timestamp-id.ext format)
          return file.name.includes(searchId);
        });
        
        if (matchingFile) {
          logger.info(`Found matching file: ${matchingFile.name} in folder ${folder.name}`);
          
          const filePath = `${folderPath}/${matchingFile.name}`;
          
          // Download the file
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('room-media')
            .download(filePath);
          
          if (downloadError || !fileData) {
            logger.error(`Error downloading file ${filePath}: ${downloadError?.message}`);
            continue;
          }
          
          // Add to found images
          foundImages.push({
            filename: matchingFile.name,
            content: Buffer.from(await fileData.arrayBuffer())
          });
          
          imageFound = true;
          break; // Found this image, move to next
        }
      }
      
      if (!imageFound) {
        logger.info(`Could not find image with ID ${imageId} in any room folders`);
      }
    }
    
    logger.info(`Found ${foundImages.length} images in room-media storage`);
    return foundImages;
  } catch (error: any) {
    logger.error(`Error in fetchRoomMediaImages: ${error.message}`);
    return [];
  }
} 