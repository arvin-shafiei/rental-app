import { Resend } from 'resend';
import dotenv from 'dotenv';
import { supabaseAdmin } from './supabase';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import axios from 'axios';
import { Property } from '../types/property';

// Load environment variables
dotenv.config();

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_TRANSACTIONAL_KEY);
const fromEmail = process.env.RESEND_TRANSACTIONAL_EMAIL || 'noreply@yourdomain.com';

export interface DepositRequestData {
  propertyId: string;
  userId: string;
  message: string;
  imageIds?: string[];
}

export class DepositRequestService {
  /**
   * Send a deposit request email to landlord
   */
  async sendDepositRequest(requestData: DepositRequestData): Promise<string> {
    console.log(`[DepositRequestService] Sending deposit request for property ${requestData.propertyId}`);
    console.log(`[DepositRequestService] Request data:`, JSON.stringify({
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
        console.error(`[DepositRequestService] Error fetching property: ${propertyError?.message || 'Property not found'}`);
        throw new Error(`Error fetching property: ${propertyError?.message || 'Property not found'}`);
      }
      
      // Get user details
      const { data: user, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', requestData.userId)
        .single();
      
      if (userError || !user) {
        console.error(`[DepositRequestService] Error fetching user: ${userError?.message || 'User not found'}`);
        throw new Error(`Error fetching user: ${userError?.message || 'User not found'}`);
      }
      
      // Validate landlord email
      if (!property.landlord_email) {
        throw new Error('Landlord email not set for this property');
      }
      
      // Prepare attachments if images are provided
      let attachments: any[] = [];
      
      if (requestData.imageIds && requestData.imageIds.length > 0) {
        console.log(`[DepositRequestService] Preparing attachments for ${requestData.imageIds.length} images`);
        attachments = await this.prepareImageAttachments(requestData.imageIds, property.id);
        console.log(`[DepositRequestService] Prepared ${attachments.length} attachments for email`);
        if (attachments.length > 0) {
          attachments.forEach((attachment, index) => {
            console.log(`[DepositRequestService] Attachment ${index + 1}: ${attachment.filename}, size: ${attachment.content?.length || 0} bytes`);
          });
        } else {
          console.log(`[DepositRequestService] No attachments were prepared successfully`);
        }
      }
      
      // Generate the email content
      const emailContent = this.generateDepositRequestEmail(property, user, requestData.message, requestData.imageIds);
      
      // Get the sender name
      const senderName = user.display_name || user.email || 'Tenant';
      
      // Send the email
      try {
        console.log(`[DepositRequestService] Sending email from: ${fromEmail} with reply-to: ${user.email}`);
        console.log(`[DepositRequestService] Email will have ${attachments.length} attachments`);
        
        const { data, error } = await resend.emails.send({
          from: `${senderName} <${fromEmail}>`,
          to: property.landlord_email,
          subject: `Deposit Request for ${property.name}`,
          html: emailContent,
          attachments: attachments,
          replyTo: user.email
        });
        
        if (error) {
          console.error(`[DepositRequestService] Error sending email:`, JSON.stringify(error));
          throw new Error(`Error sending email: ${JSON.stringify(error)}`);
        }
        
        // Store the request in the database for tracking
        const { data: depositRequest, error: insertError } = await supabaseAdmin
          .from('deposit_requests')
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
          console.error(`[DepositRequestService] Error logging deposit request: ${insertError.message}`);
          // Try an alternative approach - use text[] instead of UUID[]
          try {
            console.log('[DepositRequestService] Attempting to store image IDs as text references instead');
            const { data: textDepositRequest, error: textInsertError } = await supabaseAdmin
              .rpc('create_deposit_request_with_text_images', {
                p_property_id: requestData.propertyId,
                p_user_id: requestData.userId,
                p_message: requestData.message,
                p_image_refs: requestData.imageIds || [],
                p_status: 'sent'
              });
            
            if (textInsertError) {
              console.error(`[DepositRequestService] Error in fallback deposit request: ${textInsertError.message}`);
              // Continue anyway
            } else {
              console.log('[DepositRequestService] Successfully created deposit request with text image references');
            }
          } catch (fallbackError) {
            console.error(`[DepositRequestService] Fallback deposit request also failed: ${fallbackError}`);
            // Continue even if fallback fails
          }
        }
        
        console.log(`[DepositRequestService] Deposit request email sent successfully, ID: ${data?.id}`);
        return data?.id || 'Email sent successfully';
      } catch (emailError: any) {
        console.error('[DepositRequestService] Error in resend.emails.send:', emailError);
        throw new Error(`Failed to send email: ${emailError.message || JSON.stringify(emailError)}`);
      }
    } catch (error: any) {
      console.error(`[DepositRequestService] Error sending deposit request: ${error.message}`);
      throw new Error(`Error sending deposit request: ${error.message}`);
    }
  }
  
  /**
   * Get image metadata from the database - including path information
   */
  private async fetchPropertyImages(imageIds: string[], propertyId: string): Promise<any[]> {
    console.log(`[DepositRequestService] Fetching property images for IDs: ${JSON.stringify(imageIds)}`);
    
    try {
      // Query from property_images first
      const { data: images, error } = await supabaseAdmin
        .from('property_images')
        .select('*')
        .in('id', imageIds);
      
      if (error) {
        console.error(`[DepositRequestService] Error querying property_images: ${error.message}`);
        return [];
      }
      
      if (images && images.length > 0) {
        console.log(`[DepositRequestService] Found ${images.length} images in property_images table`);
        images.forEach((img, i) => {
          console.log(`[DepositRequestService] Image ${i + 1}: ID=${img.id}, path=${img.path}`);
        });
        return images;
      }
      
      // If no images found, try to query from a different table or handle differently
      console.log(`[DepositRequestService] No images found in property_images table, trying alternative approach`);
      
      // Try to list all property images for this property
      const { data: allPropertyImages, error: allImagesError } = await supabaseAdmin
        .from('property_images')
        .select('*')
        .eq('property_id', propertyId);
      
      if (allImagesError) {
        console.error(`[DepositRequestService] Error querying all property images: ${allImagesError.message}`);
      } else if (allPropertyImages && allPropertyImages.length > 0) {
        console.log(`[DepositRequestService] Found ${allPropertyImages.length} total images for property, but none match the requested IDs`);
        console.log(`[DepositRequestService] Available image IDs:`, allPropertyImages.map(img => img.id));
      } else {
        console.log(`[DepositRequestService] No images found for this property at all`);
      }
      
      return [];
    } catch (error: any) {
      console.error(`[DepositRequestService] Error in fetchPropertyImages: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Prepare image attachments for email
   */
  private async prepareImageAttachments(imageIds: string[], propertyId: string): Promise<any[]> {
    try {
      console.log(`[DepositRequestService] Preparing attachments for images: ${JSON.stringify(imageIds)}`);
      
      if (!imageIds || imageIds.length === 0) {
        console.log('[DepositRequestService] No image IDs provided for attachments');
        return [];
      }
      
      // Filter out any null or invalid image IDs
      const validImageIds = imageIds.filter(id => id !== null && id !== undefined);
      if (validImageIds.length === 0) {
        console.log('[DepositRequestService] No valid image IDs after filtering');
        return [];
      }
      
      // Get image metadata from the database using our helper method
      const images = await this.fetchPropertyImages(validImageIds, propertyId);
      
      if (!images || images.length === 0) {
        console.log('[DepositRequestService] No images found in database, trying direct storage access');
        return await this.fetchRoomMediaImages(validImageIds, propertyId);
      }
      
      // Download the images with proper signed URLs
      const downloadPromises = images.map(async (image) => {
        try {
          console.log(`[DepositRequestService] Processing image: ${image.id}, path: ${image.path}`);
          
          if (!image.path) {
            console.log(`[DepositRequestService] Image has no path, skipping`);
            return null;
          }
          
          // Extract necessary parts from the path
          const pathParts = image.path.split('/');
          const fileName = pathParts[pathParts.length - 1]; // Last part should be the file name
          
          // Determine the correct storage bucket
          let bucket = 'room-media';
          
          // Get the signed URL to download the image
          const { data: signedUrl, error: signedUrlError } = await supabaseAdmin
            .storage
            .from(bucket)
            .createSignedUrl(image.path, 300); // 5-minute expiry
          
          if (signedUrlError || !signedUrl?.signedUrl) {
            console.error(`[DepositRequestService] Error creating signed URL: ${signedUrlError?.message}`);
            
            // Try with the other bucket as fallback
            bucket = 'property-images';
            const { data: fallbackUrl, error: fallbackError } = await supabaseAdmin
              .storage
              .from(bucket)
              .createSignedUrl(image.path, 300);
            
            if (fallbackError || !fallbackUrl?.signedUrl) {
              console.error(`[DepositRequestService] Error creating fallback signed URL: ${fallbackError?.message}`);
              return null;
            }
            
            console.log(`[DepositRequestService] Got fallback signed URL from ${bucket} bucket`);
            
            // Download the image
            const response = await axios.get(fallbackUrl.signedUrl, {
              responseType: 'arraybuffer'
            });
            
            console.log(`[DepositRequestService] Downloaded image: size=${response.data.length} bytes`);
            
            return {
              filename: fileName,
              content: Buffer.from(response.data, 'binary'),
            };
          }
          
          console.log(`[DepositRequestService] Got signed URL from ${bucket} bucket`);
          
          // Download the image
          const response = await axios.get(signedUrl.signedUrl, {
            responseType: 'arraybuffer'
          });
          
          console.log(`[DepositRequestService] Downloaded image: size=${response.data.length} bytes`);
          
          return {
            filename: fileName,
            content: Buffer.from(response.data, 'binary'),
          };
        } catch (err: any) {
          console.error(`[DepositRequestService] Error downloading image ${image.id}: ${err.message}`);
          return null;
        }
      });
      
      const downloadedImages = (await Promise.all(downloadPromises)).filter(Boolean);
      
      console.log(`[DepositRequestService] Successfully downloaded ${downloadedImages.length} images`);
      
      if (downloadedImages.length === 0) {
        console.log('[DepositRequestService] Failed to download any images, trying room-media direct access');
        return await this.fetchRoomMediaImages(validImageIds, propertyId);
      }
      
      // Create individual attachments for each image
      const attachments = downloadedImages.map(image => ({
        filename: image?.filename,
        content: image?.content
      }));
      
      console.log(`[DepositRequestService] Returning ${attachments.length} individual image attachments`);
      return attachments;
    } catch (error: any) {
      console.error(`[DepositRequestService] Error preparing attachments: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Fetch images directly from room-media storage
   * This is a fallback if property_images table doesn't have the data
   */
  private async fetchRoomMediaImages(imageIds: string[], propertyId: string): Promise<any[]> {
    try {
      console.log(`[DepositRequestService] Attempting to fetch images directly from room-media`);
      
      // Get property details to find user ID
      const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .select('user_id')
        .eq('id', propertyId)
        .single();
      
      if (propertyError || !property) {
        console.error(`[DepositRequestService] Error fetching property for user ID: ${propertyError?.message || 'Property not found'}`);
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
        console.error(`[DepositRequestService] Error listing room folders: ${foldersError.message}`);
        return [];
      }
      
      // Create an array to store found images
      const foundImages = [];
      
      // For each room, look for images
      for (const folder of roomFolders || []) {
        if (folder.metadata !== null) continue; // Skip non-directories
        
        const roomPath = `${basePath}/${folder.name}`;
        console.log(`[DepositRequestService] Checking room: ${roomPath}`);
        
        // List images in room
        const { data: imageFiles, error: imagesError } = await supabaseAdmin.storage
          .from('room-media')
          .list(roomPath);
        
        if (imagesError) {
          console.error(`[DepositRequestService] Error listing images for room ${folder.name}: ${imagesError.message}`);
          continue;
        }
        
        // For each image file, generate signed URL and download
        for (const file of imageFiles || []) {
          if (file.metadata === null) continue; // Skip directories
          
          const imagePath = `${roomPath}/${file.name}`;
          console.log(`[DepositRequestService] Found image: ${imagePath}`);
          
          try {
            // Create signed URL
            const { data: signedUrl, error: signedUrlError } = await supabaseAdmin.storage
              .from('room-media')
              .createSignedUrl(imagePath, 300);
            
            if (signedUrlError || !signedUrl) {
              console.error(`[DepositRequestService] Error creating signed URL for ${imagePath}: ${signedUrlError?.message}`);
              continue;
            }
            
            // Download image
            const response = await axios.get(signedUrl.signedUrl, {
              responseType: 'arraybuffer'
            });
            
            console.log(`[DepositRequestService] Downloaded image: ${imagePath}, size: ${response.data.length} bytes`);
            
            foundImages.push({
              filename: file.name,
              content: Buffer.from(response.data, 'binary')
            });
            
            // Limit to matching the number of requested image IDs
            if (foundImages.length >= imageIds.length) {
              break;
            }
          } catch (err: any) {
            console.error(`[DepositRequestService] Error processing image ${imagePath}: ${err.message}`);
          }
        }
        
        // Stop if we've found enough images
        if (foundImages.length >= imageIds.length) {
          break;
        }
      }
      
      console.log(`[DepositRequestService] Found ${foundImages.length} images directly from room-media`);
      return foundImages;
    } catch (error: any) {
      console.error(`[DepositRequestService] Error in fetchRoomMediaImages: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Generate HTML email content for deposit request
   */
  private generateDepositRequestEmail(property: Property, user: any, message: string, imageIds?: string[]): string {
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
    
    // Get sender name
    const senderName = user.display_name || user.email;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Request</title>
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
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Deposit Request</h2>
          </div>
          
          <p>Dear Landlord,</p>
          
          <p>A deposit request has been submitted for the following property:</p>
          
          <div class="property-info">
            <h3>${property.name || 'Property'} ${property.emoji || ''}</h3>
            
            <div class="property-detail">
              <div class="property-label">Address:</div>
              <div>${[
                property.address_line1, 
                property.address_line2,
                property.city,
                property.county,
                property.postcode,
                property.country
              ].filter(Boolean).join(', ')}</div>
            </div>
            
            <div class="property-detail">
              <div class="property-label">Property Type:</div>
              <div>${property.property_type || 'Not specified'}</div>
            </div>
            
            <div class="property-detail">
              <div class="property-label">Monthly Rent:</div>
              <div>${formatCurrency(property.rent_amount)}</div>
            </div>
          </div>
          
          <div class="highlight">
            <div>Requested Deposit Amount: ${formatCurrency(property.deposit_amount)}</div>
            <div>Lease Period: ${formatDate(property.lease_start_date)} to ${formatDate(property.lease_end_date)}</div>
          </div>
          
          <div class="message-section">
            <h3>Message from ${senderName}</h3>
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          ${imageIds && imageIds.length > 0 ? 
            '<p><strong>Note:</strong> Please find attached images related to this request.</p>' : ''}
          
          <p>You can reply directly to this email to contact the tenant.</p>
          
          <div class="footer">
            <p>This message was sent through RentHive Property Management Platform on behalf of ${senderName}.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 