import { supabaseAdmin } from './supabase';
import { Property } from '../types/property';
import { Logger } from '../utils/loggerUtils';
import { DbUtils } from '../utils/dbUtils';
import { prepareImageAttachments } from '../utils/imageUtils';
import { formatAddress, formatCurrency, formatDate, generateEmailTemplate, sendEmail } from '../utils/emailUtils';

export interface RequestData {
  propertyId: string;
  userId: string;
  message: string;
  imageIds?: string[];
}

/**
 * Base class for request services (deposit, repair, etc.)
 */
export abstract class BaseRequestService {
  protected logger: Logger;
  protected tableName: string;
  protected requestType: string;
  protected fallbackProcedure?: string;
  
  /**
   * Initialize the request service
   */
  constructor(requestType: string, tableName: string, fallbackProcedure?: string) {
    this.logger = new Logger(`${requestType}Service`);
    this.requestType = requestType;
    this.tableName = tableName;
    this.fallbackProcedure = fallbackProcedure;
  }
  
  /**
   * Process a request and send email to landlord
   */
  async sendRequest(requestData: RequestData): Promise<string> {
    this.logger.methodStart('sendRequest', {
      ...requestData,
      message: requestData.message.substring(0, 50) + '...' // Log truncated message
    });
    
    try {
      // Get property details
      const property = await this.getProperty(requestData.propertyId);
      
      // Get user details
      const user = await this.getUser(requestData.userId);
      
      // Validate landlord email
      if (!property.landlord_email) {
        throw new Error('Landlord email not set for this property');
      }
      
      // Prepare attachments if images are provided
      let attachments: any[] = [];
      
      if (requestData.imageIds && requestData.imageIds.length > 0) {
        this.logger.info(`Preparing attachments for ${requestData.imageIds.length} images`);
        attachments = await prepareImageAttachments(requestData.imageIds, property.id);
        this.logger.info(`Prepared ${attachments.length} attachments for email`);
        
        if (attachments.length > 0) {
          attachments.forEach((attachment, index) => {
            this.logger.info(`Attachment ${index + 1}: ${attachment.filename}, size: ${attachment.content?.length || 0} bytes`);
          });
        } else {
          this.logger.info(`No attachments were prepared successfully`);
        }
      }
      
      // Get the sender name
      const senderName = user.display_name || user.email || 'Tenant';
      
      // Generate the email content
      const emailContent = this.generateEmailContent(
        property, 
        user, 
        requestData.message, 
        requestData.imageIds
      );
      
      // Send the email
      try {
        const data = await sendEmail(
          property.landlord_email,
          `${this.requestType} Request for ${property.name}`,
          emailContent,
          attachments,
          senderName,
          user.email,
          requestData.userId
        );
        
        // Store the request in the database for tracking
        await this.saveRequest(requestData);
        
        this.logger.info(`${this.requestType} request email sent successfully, ID: ${data?.id}`);
        return data?.id || 'Email sent successfully';
      } catch (emailError: any) {
        this.logger.error('Error in sending email:', emailError);
        throw new Error(`Failed to send email: ${emailError.message || JSON.stringify(emailError)}`);
      }
    } catch (error: any) {
      this.logger.error(`Error sending ${this.requestType.toLowerCase()} request:`, error);
      throw new Error(`Error sending ${this.requestType.toLowerCase()} request: ${error.message}`);
    }
  }
  
  /**
   * Get property details
   */
  private async getProperty(propertyId: string): Promise<Property> {
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();
    
    if (propertyError || !property) {
      this.logger.error(`Error fetching property: ${propertyError?.message || 'Property not found'}`);
      throw new Error(`Error fetching property: ${propertyError?.message || 'Property not found'}`);
    }
    
    return property as Property;
  }
  
  /**
   * Get user details
   */
  private async getUser(userId: string): Promise<any> {
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      this.logger.error(`Error fetching user: ${userError?.message || 'User not found'}`);
      throw new Error(`Error fetching user: ${userError?.message || 'User not found'}`);
    }
    
    return user;
  }
  
  /**
   * Save the request to the database
   */
  private async saveRequest(requestData: RequestData): Promise<void> {
    try {
      const { error: insertError } = await supabaseAdmin
        .from(this.tableName)
        .insert([{
          property_id: requestData.propertyId,
          user_id: requestData.userId,
          message: requestData.message,
          image_ids: requestData.imageIds && requestData.imageIds.length > 0 
            ? requestData.imageIds.filter(id => id !== null && id !== undefined)
            : [],
          status: 'sent'
        }]);
      
      if (insertError) {
        this.logger.error(`Error logging ${this.requestType.toLowerCase()} request: ${insertError.message}`);
        
        // Try fallback procedure if available
        if (this.fallbackProcedure) {
          try {
            this.logger.info(`Attempting to store image IDs as text references instead`);
            const { error: textInsertError } = await supabaseAdmin
              .rpc(this.fallbackProcedure, {
                p_property_id: requestData.propertyId,
                p_user_id: requestData.userId,
                p_message: requestData.message,
                p_image_refs: requestData.imageIds || [],
                p_status: 'sent'
              });
            
            if (textInsertError) {
              this.logger.error(`Error in fallback request: ${textInsertError.message}`);
            } else {
              this.logger.info(`Successfully created ${this.requestType.toLowerCase()} request with text image references`);
            }
          } catch (fallbackError) {
            this.logger.error(`Fallback request also failed: ${fallbackError}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error in saveRequest:`, error);
    }
  }
  
  /**
   * Generate email content - should be implemented by derived classes
   */
  protected abstract generateEmailContent(
    property: Property, 
    user: any, 
    message: string, 
    imageIds?: string[]
  ): string;
} 