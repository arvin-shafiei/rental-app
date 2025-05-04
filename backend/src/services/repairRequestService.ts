import { Resend } from 'resend';
import { supabaseAdmin } from './supabase';
import { Property } from '../types/property';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_TRANSACTIONAL_KEY);
const fromEmail = process.env.RESEND_TRANSACTIONAL_EMAIL || 'noreply@yourdomain.com';

export interface RepairRequestData {
  propertyId: string;
  userId: string;
  message: string;
  imageIds?: string[];
}

export class RepairRequestService {
  /**
   * Send a repair request email to landlord
   */
  async sendRepairRequest(requestData: RepairRequestData): Promise<string> {
    console.log(`[RepairRequestService] Sending repair request for property ${requestData.propertyId}`);
    console.log(`[RepairRequestService] Request data:`, JSON.stringify({
      ...requestData,
      message: requestData.message.substring(0, 50) + '...' // Log truncated message
    }));
    
    try {
      // Get property details
      const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .select('*')
        .eq('id', requestData.propertyId)
        .single();
      
      if (propertyError || !property) {
        console.error(`[RepairRequestService] Error fetching property: ${propertyError?.message || 'Property not found'}`);
        throw new Error(`Error fetching property: ${propertyError?.message || 'Property not found'}`);
      }
      
      // Get user details
      const { data: user, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', requestData.userId)
        .single();
      
      if (userError || !user) {
        console.error(`[RepairRequestService] Error fetching user: ${userError?.message || 'User not found'}`);
        throw new Error(`Error fetching user: ${userError?.message || 'User not found'}`);
      }
      
      // Validate landlord email
      if (!property.landlord_email) {
        throw new Error('Landlord email not set for this property');
      }
      
      // Prepare attachments if images are provided
      let attachments: any[] = [];
      
      if (requestData.imageIds && requestData.imageIds.length > 0) {
        console.log(`[RepairRequestService] Preparing attachments for ${requestData.imageIds.length} images`);
        attachments = await this.prepareImageAttachments(requestData.imageIds, property.id);
        console.log(`[RepairRequestService] Prepared ${attachments.length} attachments for email`);
        if (attachments.length > 0) {
          attachments.forEach((attachment, index) => {
            console.log(`[RepairRequestService] Attachment ${index + 1}: ${attachment.filename}, size: ${attachment.content?.length || 0} bytes`);
          });
        } else {
          console.log(`[RepairRequestService] No attachments were prepared successfully`);
        }
      }
      
      // Generate the email content
      const emailContent = this.generateRepairRequestEmail(property, user, requestData.message, requestData.imageIds);
      
      // Get the sender name
      const senderName = user.display_name || user.email || 'Tenant';
      
      // Send the email
      try {
        console.log(`[RepairRequestService] Sending email from: ${fromEmail} with reply-to: ${user.email}`);
        console.log(`[RepairRequestService] Email will have ${attachments.length} attachments`);
        
        const { data, error } = await resend.emails.send({
          from: `${senderName} <${fromEmail}>`,
          to: property.landlord_email,
          subject: `Repair Request for ${property.name}`,
          html: emailContent,
          attachments: attachments,
          replyTo: user.email
        });
        
        if (error) {
          console.error(`[RepairRequestService] Error sending email:`, JSON.stringify(error));
          throw new Error(`Error sending email: ${JSON.stringify(error)}`);
        }
        
        // Store the request in the database for tracking
        const { data: repairRequest, error: insertError } = await supabaseAdmin
          .from('repair_requests')
          .insert([{
            property_id: requestData.propertyId,
            user_id: requestData.userId,
            message: requestData.message,
            image_ids: requestData.imageIds && requestData.imageIds.length > 0 
              ? requestData.imageIds.filter(id => id !== null && id !== undefined)
              : [],
            status: 'sent'
          }])
          .select()
          .single();
        
        if (insertError) {
          console.error(`[RepairRequestService] Error logging repair request: ${insertError.message}`);
          // Try an alternative approach - use text[] instead of UUID[]
          try {
            console.log('[RepairRequestService] Attempting to store image IDs as text references instead');
            const { data: textRepairRequest, error: textInsertError } = await supabaseAdmin
              .rpc('create_repair_request_with_text_images', {
                p_property_id: requestData.propertyId,
                p_user_id: requestData.userId,
                p_message: requestData.message,
                p_image_refs: requestData.imageIds || [],
                p_status: 'sent'
              });
            
            if (textInsertError) {
              console.error(`[RepairRequestService] Error in fallback repair request: ${textInsertError.message}`);
              // Continue anyway
            } else {
              console.log('[RepairRequestService] Successfully created repair request with text image references');
            }
          } catch (fallbackError) {
            console.error(`[RepairRequestService] Fallback repair request also failed: ${fallbackError}`);
            // Continue even if fallback fails
          }
        }
        
        console.log(`[RepairRequestService] Repair request email sent successfully, ID: ${data?.id}`);
        return data?.id || 'Email sent successfully';
      } catch (emailError: any) {
        console.error('[RepairRequestService] Error in resend.emails.send:', emailError);
        throw new Error(`Failed to send email: ${emailError.message || JSON.stringify(emailError)}`);
      }
    } catch (error: any) {
      console.error(`[RepairRequestService] Error sending repair request: ${error.message}`);
      throw new Error(`Error sending repair request: ${error.message}`);
    }
  }
  
  /**
   * Fetch property images from database
   */
  private async fetchPropertyImages(imageIds: string[], propertyId: string): Promise<any[]> {
    console.log(`[RepairRequestService] Fetching property images for IDs: ${JSON.stringify(imageIds)}`);
    
    try {
      // Fetch property images
      const { data: images, error } = await supabaseAdmin
        .from('property_images')
        .select('*')
        .in('id', imageIds)
        .eq('property_id', propertyId);
      
      if (error) {
        console.error(`[RepairRequestService] Error fetching images: ${error.message}`);
        return [];
      }
      
      if (!images || images.length === 0) {
        console.log(`[RepairRequestService] No images found in property_images table`);
        return [];
      }
      
      console.log(`[RepairRequestService] Found ${images.length} images in database`);
      
      return images.map(image => ({
        id: image.id,
        filename: image.filename,
        path: image.path,
        url: image.url
      }));
    } catch (error: any) {
      console.error(`[RepairRequestService] Error in fetchPropertyImages: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Prepare image attachments for email
   */
  private async prepareImageAttachments(imageIds: string[], propertyId: string): Promise<any[]> {
    try {
      console.log(`[RepairRequestService] Preparing attachments for images: ${JSON.stringify(imageIds)}`);
      
      if (!imageIds || imageIds.length === 0) {
        console.log('[RepairRequestService] No image IDs provided for attachments');
        return [];
      }
      
      // Filter out any null or invalid image IDs
      const validImageIds = imageIds.filter(id => id !== null && id !== undefined);
      if (validImageIds.length === 0) {
        console.log('[RepairRequestService] No valid image IDs after filtering');
        return [];
      }
      
      // Get image metadata from the database using our helper method
      const images = await this.fetchPropertyImages(validImageIds, propertyId);
      
      if (!images || images.length === 0) {
        console.log('[RepairRequestService] No images found in database, trying direct storage access');
        return await this.fetchRoomMediaImages(validImageIds, propertyId);
      }
      
      console.log(`[RepairRequestService] Processing ${images.length} images for email attachments`);
      
      // Download each image and prepare as attachment
      const downloadPromises = images.map(async (image) => {
        try {
          // Get the path components
          const pathParts = image.path.split('/');
          const bucket = 'property-images';
          const path = image.path;
          
          console.log(`[RepairRequestService] Downloading image from path: ${path}`);
          
          // Download file from storage
          const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .download(path);
          
          if (error) {
            console.error(`[RepairRequestService] Error downloading image ${image.id}: ${error.message}`);
            return null;
          }
          
          if (!data) {
            console.error(`[RepairRequestService] No data returned when downloading image ${image.id}`);
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
          
          console.log(`[RepairRequestService] Successfully downloaded image ${image.id} (${buffer.byteLength} bytes)`);
          
          return {
            filename,
            content: buffer
          };
        } catch (error: any) {
          console.error(`[RepairRequestService] Error processing image ${image.id}: ${error.message}`);
          return null;
        }
      });
      
      const downloadedImages = (await Promise.all(downloadPromises)).filter(Boolean);
      
      console.log(`[RepairRequestService] Successfully downloaded ${downloadedImages.length} images`);
      
      if (downloadedImages.length === 0) {
        console.log('[RepairRequestService] Failed to download any images, trying room-media direct access');
        return await this.fetchRoomMediaImages(validImageIds, propertyId);
      }
      
      // Create individual attachments for each image
      const attachments = downloadedImages.map(image => ({
        filename: image?.filename,
        content: image?.content
      }));
      
      console.log(`[RepairRequestService] Returning ${attachments.length} individual image attachments`);
      return attachments;
    } catch (error: any) {
      console.error(`[RepairRequestService] Error preparing attachments: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Fetch images directly from room-media storage
   * This is a fallback if property_images table doesn't have the data
   */
  private async fetchRoomMediaImages(imageIds: string[], propertyId: string): Promise<any[]> {
    try {
      console.log(`[RepairRequestService] Attempting to fetch images directly from room-media`);
      
      // Get property details to find user ID
      const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .select('user_id')
        .eq('id', propertyId)
        .single();
      
      if (propertyError || !property) {
        console.error(`[RepairRequestService] Error fetching property for user ID: ${propertyError?.message || 'Property not found'}`);
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
        console.error(`[RepairRequestService] Error listing room folders: ${foldersError.message}`);
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
        
        console.log(`[RepairRequestService] Looking for image with searchId: ${searchId}`);
        
        // For each room folder, search for this image
        for (const folder of roomFolders || []) {
          if (!folder.name || folder.name === '.emptyFolderPlaceholder') continue;
          
          // List files in this room folder
          const folderPath = `${basePath}/${folder.name}`;
          const { data: files, error: filesError } = await supabaseAdmin.storage
            .from('room-media')
            .list(folderPath);
          
          if (filesError) {
            console.error(`[RepairRequestService] Error listing files in ${folderPath}: ${filesError.message}`);
            continue;
          }
          
          // Find a file that matches this image ID
          const matchingFile = files?.find(file => {
            if (!file.name) return false;
            
            // Check if filename contains our search ID (could be part of timestamp-id.ext format)
            return file.name.includes(searchId);
          });
          
          if (matchingFile) {
            console.log(`[RepairRequestService] Found matching file: ${matchingFile.name} in folder ${folder.name}`);
            
            const filePath = `${folderPath}/${matchingFile.name}`;
            
            // Download the file
            const { data: fileData, error: downloadError } = await supabaseAdmin.storage
              .from('room-media')
              .download(filePath);
            
            if (downloadError || !fileData) {
              console.error(`[RepairRequestService] Error downloading file ${filePath}: ${downloadError?.message}`);
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
          console.log(`[RepairRequestService] Could not find image with ID ${imageId} in any room folders`);
        }
      }
      
      console.log(`[RepairRequestService] Found ${foundImages.length} images in room-media storage`);
      return foundImages;
    } catch (error: any) {
      console.error(`[RepairRequestService] Error in fetchRoomMediaImages: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Generate HTML email content for repair request
   */
  private generateRepairRequestEmail(property: Property, user: any, message: string, imageIds?: string[]): string {
    // Format currency for rent and deposit
    const formatCurrency = (amount?: number) => {
      if (!amount) return 'Not specified';
      return `£${amount.toFixed(2)}`;
    };
    
    // Format date for lease periods
    const formatDate = (dateString?: string) => {
      if (!dateString) return 'Not specified';
      return new Date(dateString).toLocaleDateString('en-GB');
    };
    
    // Format address from individual components
    const formatAddress = (property: Property) => {
      const parts = [];
      if (property.address_line1) parts.push(property.address_line1);
      if (property.address_line2) parts.push(property.address_line2);
      if (property.city) parts.push(property.city);
      if (property.county) parts.push(property.county);
      parts.push(property.postcode);
      if (property.country) parts.push(property.country);
      
      return parts.join(', ');
    };
    
    // Get sender name
    const senderName = user.display_name || user.email;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Repair Request</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #000000;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .property-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
          }
          .property-info h3 {
            margin-top: 0;
            color: #000000;
          }
          .property-detail {
            display: flex;
            margin-bottom: 5px;
          }
          .property-label {
            font-weight: bold;
            width: 140px;
          }
          .message-section {
            border-top: 1px solid #eee;
            margin-top: 20px;
            padding-top: 20px;
          }
          .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #555;
            text-align: center;
          }
          .highlight {
            background-color: #f8f8d7;
            padding: 10px;
            border-radius: 5px;
            border-left: 4px solid #e6b800;
            margin: 15px 0;
            font-weight: bold;
          }
          .urgent {
            background-color: #fdd;
            border-left: 4px solid #d33;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Repair Request</h2>
          </div>
          
          <p>Dear Landlord,</p>
          
          <p>A repair request has been submitted for the following property:</p>
          
          <div class="property-info">
            <h3>${property.name}</h3>
            
            <div class="property-detail">
              <div class="property-label">Address:</div>
              <div>${formatAddress(property)}</div>
            </div>
            
            <div class="property-detail">
              <div class="property-label">Lease period:</div>
              <div>${formatDate(property.lease_start_date)} to ${formatDate(property.lease_end_date)}</div>
            </div>
            
            <div class="property-detail">
              <div class="property-label">Tenant:</div>
              <div>${senderName}</div>
            </div>
          </div>
          
          <div class="message-section">
            <h3>Repair Request Details:</h3>
            <div style="white-space: pre-wrap;">${message}</div>
          </div>
          
          ${imageIds && imageIds.length > 0 ? 
              `<p style="margin-top: 20px"><strong>${imageIds.length} image${imageIds.length !== 1 ? 's have' : ' has'} been attached to help illustrate the issue.</strong></p>` : 
              ''}
          
          <div class="highlight">
            Please reply to this email to respond to the tenant directly.
          </div>
          
          <div class="footer">
            This message was sent through RentHive Property Management Platform on behalf of ${senderName}
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 