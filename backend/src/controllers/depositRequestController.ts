import { Request, Response } from 'express';
import { DepositRequestService, DepositRequestData } from '../services/depositRequestService';
import { BaseController } from '../utils/controllerUtils';
import { Logger } from '../utils/loggerUtils';
import { DbUtils } from '../utils/dbUtils';

// Initialize the deposit request service
const depositRequestService = new DepositRequestService();

export class DepositRequestController extends BaseController {
  private logger = new Logger('DepositRequestController');
  
  /**
   * Send a deposit request email to landlord
   */
  async sendDepositRequest(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    
    if (!this.validatePropertyId(req, res)) {
      return;
    }
    
    const propertyId = req.query.propertyId as string;
    
    this.logger.methodStart('sendDepositRequest', { 
      propertyId, 
      userId,
      body: req.body
    });
    
    try {
      const { message, imageIds } = req.body;
      
      this.logger.info(`Extracted imageIds:`, imageIds);
      
      if (!this.validateMessage(req, res)) {
        return;
      }
      
      const requestData: DepositRequestData = {
        propertyId,
        userId,
        message,
        imageIds: Array.isArray(imageIds) ? imageIds : []
      };
      
      this.logger.info(`Sending data to service:`, {
        ...requestData,
        message: requestData.message.substring(0, 50) + '...'
      });
      
      const emailId = await depositRequestService.sendDepositRequest(requestData);
      
      this.sendSuccess(res, 'Deposit request sent successfully', { emailId });
    } catch (error: any) {
      this.logger.methodError('sendDepositRequest', error);
      
      const statusCode = this.getErrorStatusCode(error);
      
      this.sendError(res, error.message, statusCode);
    }
  }
  
  /**
   * Get deposit request history for a property
   */
  async getDepositRequests(req: Request, res: Response): Promise<void> {
    if (!this.validatePropertyId(req, res)) {
      return;
    }
    
    const propertyId = req.query.propertyId as string;
    
    this.logger.methodStart('getDepositRequests', { propertyId });
    
    try {
      const depositRequests = await DbUtils.getByPropertyId(
        'deposit_requests', 
        propertyId,
        'created_at',
        false
      );
      
      this.sendSuccess(res, 'Deposit requests retrieved successfully', depositRequests);
    } catch (error: any) {
      this.logger.methodError('getDepositRequests', error);
      this.sendError(res, error.message);
    }
  }
} 