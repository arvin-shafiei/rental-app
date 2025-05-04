import { Request, Response } from 'express';
import { RepairRequestService, RepairRequestData } from '../services/repairRequestService';
import { supabaseAdmin } from '../services/supabase';

// Initialize the repair request service
const repairRequestService = new RepairRequestService();

export class RepairRequestController {
  /**
   * Send a repair request email to landlord
   */
  async sendRepairRequest(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const propertyId = req.query.propertyId as string;
    
    if (!propertyId) {
      res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
      return;
    }
    
    console.log(`[RepairRequestController] Sending repair request for property ${propertyId} by user ${userId}`);
    console.log(`[RepairRequestController] Full request body:`, JSON.stringify(req.body));
    
    try {
      const { message, imageIds } = req.body;
      
      console.log(`[RepairRequestController] Extracted imageIds:`, JSON.stringify(imageIds));
      
      if (!message || message.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Message is required'
        });
        return;
      }
      
      const requestData: RepairRequestData = {
        propertyId,
        userId,
        message,
        imageIds: Array.isArray(imageIds) ? imageIds : []
      };
      
      console.log(`[RepairRequestController] Sending data to service:`, JSON.stringify({
        ...requestData,
        message: requestData.message.substring(0, 50) + '...'
      }));
      
      const emailId = await repairRequestService.sendRepairRequest(requestData);
      
      res.status(200).json({
        success: true,
        message: 'Repair request sent successfully',
        data: { emailId }
      });
    } catch (error: any) {
      console.error(`[RepairRequestController] Error sending repair request: ${error.message}`);
      
      const statusCode = error.message.includes('not found') || 
                         error.message.includes('not set') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Get repair request history for a property
   */
  async getRepairRequests(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const propertyId = req.query.propertyId as string;
    
    if (!propertyId) {
      res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
      return;
    }
    
    console.log(`[RepairRequestController] Getting repair requests for property ${propertyId}`);
    
    try {
      // Use imported supabaseAdmin instead of req.supabaseAdmin
      const { data: repairRequests, error } = await supabaseAdmin
        .from('repair_requests')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Error fetching repair requests: ${error.message}`);
      }
      
      res.status(200).json({
        success: true,
        message: 'Repair requests retrieved successfully',
        data: repairRequests
      });
    } catch (error: any) {
      console.error(`[RepairRequestController] Error getting repair requests: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
} 