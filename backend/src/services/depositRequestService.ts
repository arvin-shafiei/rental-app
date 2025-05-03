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
      let attachments = undefined;
      
      if (requestData.imageIds && requestData.imageIds.length > 0) {
        attachments = await this.prepareImageAttachments(requestData.imageIds, property.id);
      }
      
      // Generate the email content
      const emailContent = this.generateDepositRequestEmail(property, user, requestData.message, requestData.imageIds);
      
      // Get the sender name
      const senderName = user.display_name || user.email || 'Tenant';
      
      // Send the email
      try {
        console.log(`[DepositRequestService] Sending email from: ${fromEmail} with reply-to: ${user.email}`);
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
            image_ids: requestData.imageIds || [],
            status: 'sent'
          }])
          .select()
          .single();
        
        if (insertError) {
          console.error(`[DepositRequestService] Error logging deposit request: ${insertError.message}`);
          // Continue even if logging fails
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
   * Prepare image attachments for email
   * If multiple images, create a zip file
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
      
      // Get image metadata from the database
      const { data: images, error } = await supabaseAdmin
        .from('property_images')
        .select('*')
        .in('id', validImageIds)
        .eq('property_id', propertyId);
      
      console.log(`[DepositRequestService] Found ${images?.length || 0} images in database`);
      
      if (error || !images || images.length === 0) {
        console.error(`[DepositRequestService] Error fetching images: ${error?.message || 'No images found'}`);
        return [];
      }
      
      // Download the images
      const downloadPromises = images.map(async (image) => {
        try {
          console.log(`[DepositRequestService] Processing image: ${image.id}, path: ${image.path}`);
          
          // Get the signed URL to download the image
          const { data: signedUrl } = await supabaseAdmin
            .storage
            .from('property-images')
            .createSignedUrl(image.path, 60); // 60 seconds expiry
          
          if (!signedUrl?.signedUrl) {
            throw new Error(`Could not generate signed URL for ${image.path}`);
          }
          
          console.log(`[DepositRequestService] Got signed URL for image: ${image.path}`);
          
          // Download the image
          const response = await axios.get(signedUrl.signedUrl, {
            responseType: 'arraybuffer'
          });
          
          console.log(`[DepositRequestService] Downloaded image: ${image.path}, size: ${response.data.length} bytes`);
          
          return {
            filename: path.basename(image.path),
            content: Buffer.from(response.data, 'binary'),
            path: image.path
          };
        } catch (err: any) {
          console.error(`[DepositRequestService] Error downloading image ${image.path}: ${err.message}`);
          return null;
        }
      });
      
      const downloadedImages = (await Promise.all(downloadPromises)).filter(Boolean);
      
      console.log(`[DepositRequestService] Successfully downloaded ${downloadedImages.length} images`);
      
      if (downloadedImages.length === 0) {
        return [];
      }
      
      // Instead of creating a zip, return each image as separate attachment
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
            <p>This message was sent through Rental App on behalf of ${senderName}.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
} 