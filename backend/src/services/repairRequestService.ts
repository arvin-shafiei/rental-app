import { supabaseAdmin } from './supabase';
import { Property } from '../types/property';
import { prepareImageAttachments } from '../utils/imageUtils';
import { formatAddress, formatCurrency, formatDate, generateEmailTemplate, sendEmail, fromEmail } from '../utils/emailUtils';
import { BaseRequestService, RequestData } from './baseRequestService';

export interface RepairRequestData extends RequestData {}

export class RepairRequestService extends BaseRequestService {
  constructor() {
    super('Repair', 'repair_requests', 'create_repair_request_with_text_images');
  }
  
  /**
   * Send a repair request email to landlord
   */
  async sendRepairRequest(requestData: RepairRequestData): Promise<string> {
    return this.sendRequest(requestData);
  }

  /**
   * Generate HTML email content for repair request
   */
  protected generateEmailContent(property: Property, user: any, message: string, imageIds?: string[]): string {
    // Get sender name
    const senderName = user.display_name || user.email;
    
    return generateEmailTemplate(
      'Repair Request',
      senderName,
      property,
      message,
      imageIds
    );
  }
} 