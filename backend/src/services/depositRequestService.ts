import { Property } from '../types/property';
import { BaseRequestService, RequestData } from './baseRequestService';
import { formatCurrency, formatDate, generateEmailTemplate } from '../utils/emailUtils';

export interface DepositRequestData extends RequestData {}

export class DepositRequestService extends BaseRequestService {
  constructor() {
    super('Deposit', 'deposit_requests', 'create_deposit_request_with_text_images');
  }
  
  /**
   * Send a deposit request email to landlord
   */
  async sendDepositRequest(requestData: DepositRequestData): Promise<string> {
    return this.sendRequest(requestData);
  }
  
  /**
   * Generate HTML email content for deposit request
   */
  protected generateEmailContent(property: Property, user: any, message: string, imageIds?: string[]): string {
    // Get sender name
    const senderName = user.display_name || user.email;
    
    // Create additional info section specific to deposit requests
    const additionalInfo = `
      <div>Requested Deposit Amount: ${formatCurrency(property.deposit_amount)}</div>
      <div>Lease Period: ${formatDate(property.lease_start_date)} to ${formatDate(property.lease_end_date)}</div>
    `;
    
    return generateEmailTemplate(
      'Deposit Request',
      senderName,
      property,
      message,
      imageIds,
      additionalInfo
    );
  }
} 