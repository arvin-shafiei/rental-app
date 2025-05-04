import { Resend } from 'resend';
import { Property } from '../types/property';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_TRANSACTIONAL_KEY);
const fromEmail = process.env.RESEND_TRANSACTIONAL_EMAIL || 'noreply@yourdomain.com';

/**
 * Send email with attachments using Resend service
 */
export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string,
  attachments: any[],
  senderName: string,
  replyTo?: string
): Promise<any> {
  try {
    console.log(`[EmailUtils] Sending email from: ${fromEmail} with reply-to: ${replyTo}`);
    console.log(`[EmailUtils] Email will have ${attachments.length} attachments`);
    
    const { data, error } = await resend.emails.send({
      from: `${senderName} <${fromEmail}>`,
      to,
      subject,
      html: htmlContent,
      attachments,
      replyTo
    });
    
    if (error) {
      console.error(`[EmailUtils] Error sending email:`, JSON.stringify(error));
      throw new Error(`Error sending email: ${JSON.stringify(error)}`);
    }
    
    return data;
  } catch (error: any) {
    console.error('[EmailUtils] Error in resend.emails.send:', error);
    throw new Error(`Failed to send email: ${error.message || JSON.stringify(error)}`);
  }
}

/**
 * Format currency for display (£ with 2 decimal places)
 */
export function formatCurrency(amount?: number): string {
  if (!amount) return 'Not specified';
  return `£${amount.toFixed(2)}`;
}

/**
 * Format date for lease periods in UK format
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'Not specified';
  return new Date(dateString).toLocaleDateString('en-GB');
}

/**
 * Format address from individual property components
 */
export function formatAddress(property: Property): string {
  const parts = [];
  if (property.address_line1) parts.push(property.address_line1);
  if (property.address_line2) parts.push(property.address_line2);
  if (property.city) parts.push(property.city);
  if (property.county) parts.push(property.county);
  parts.push(property.postcode);
  if (property.country) parts.push(property.country);
  
  return parts.join(', ');
}

/**
 * Generate base email HTML template
 */
export function generateEmailTemplate(
  title: string,
  senderName: string,
  property: Property,
  message: string,
  imageIds?: string[],
  additionalInfo?: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
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
          <h2>${title}</h2>
        </div>
        
        <p>Dear Landlord,</p>
        
        <p>A ${title.toLowerCase()} has been submitted for the following property:</p>
        
        <div class="property-info">
          <h3>${property.name || 'Property'} ${property.emoji || ''}</h3>
          
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
        
        ${additionalInfo ? `<div class="highlight">${additionalInfo}</div>` : ''}
        
        <div class="message-section">
          <h3>${title} Details:</h3>
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

export { resend, fromEmail }; 