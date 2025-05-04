import { Request, Response } from 'express';
import { RepairRequestService, RepairRequestData } from '../services/repairRequestService';
import { supabaseAdmin } from '../services/supabase';
import { BaseController } from '../utils/controllerUtils';
import { Logger } from '../utils/loggerUtils';
import { DbUtils } from '../utils/dbUtils';

// Initialize the repair request service
const repairRequestService = new RepairRequestService();

export class RepairRequestController extends BaseController {
  private logger = new Logger('RepairRequestController');
  
  /**
   * Send a repair request email to landlord
   */
  async sendRepairRequest(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    
    if (!this.validatePropertyId(req, res)) {
      return;
    }
    
    const propertyId = req.query.propertyId as string;
    
    this.logger.methodStart('sendRepairRequest', { 
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
      
      const requestData: RepairRequestData = {
        propertyId,
        userId,
        message,
        imageIds: Array.isArray(imageIds) ? imageIds : []
      };
      
      this.logger.info(`Sending data to service:`, {
        ...requestData,
        message: requestData.message.substring(0, 50) + '...'
      });
      
      const emailId = await repairRequestService.sendRepairRequest(requestData);
      
      this.sendSuccess(res, 'Repair request sent successfully', { emailId });
    } catch (error: any) {
      this.logger.methodError('sendRepairRequest', error);
      
      const statusCode = this.getErrorStatusCode(error);
      
      this.sendError(res, error.message, statusCode);
    }
  }
  
  /**
   * Get repair request history for a property
   */
  async getRepairRequests(req: Request, res: Response): Promise<void> {
    if (!this.validatePropertyId(req, res)) {
      return;
    }
    
    const propertyId = req.query.propertyId as string;
    
    this.logger.methodStart('getRepairRequests', { propertyId });
    
    try {
      const repairRequests = await DbUtils.getByPropertyId(
        'repair_requests', 
        propertyId,
        'created_at',
        false
      );
      
      this.sendSuccess(res, 'Repair requests retrieved successfully', repairRequests);
    } catch (error: any) {
      this.logger.methodError('getRepairRequests', error);
      this.sendError(res, error.message);
    }
  }
} 