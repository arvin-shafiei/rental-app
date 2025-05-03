import { Request, Response } from 'express';
import { DepositRequestService, DepositRequestData } from '../services/depositRequestService';
import { supabaseAdmin } from '../services/supabase';

// Initialize the deposit request service
const depositRequestService = new DepositRequestService();

export class DepositRequestController {
  /**
   * Send a deposit request email to landlord
   */
  async sendDepositRequest(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const propertyId = req.query.propertyId as string;
    
    if (!propertyId) {
      res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
      return;
    }
    
    console.log(`[DepositRequestController] Sending deposit request for property ${propertyId} by user ${userId}`);
    
    try {
      const { message, imageIds } = req.body;
      
      if (!message || message.trim() === '') {
        res.status(400).json({
          success: false,
          message: 'Message is required'
        });
        return;
      }
      
      const requestData: DepositRequestData = {
        propertyId,
        userId,
        message,
        imageIds
      };
      
      const emailId = await depositRequestService.sendDepositRequest(requestData);
      
      res.status(200).json({
        success: true,
        message: 'Deposit request sent successfully',
        data: { emailId }
      });
    } catch (error: any) {
      console.error(`[DepositRequestController] Error sending deposit request: ${error.message}`);
      
      const statusCode = error.message.includes('not found') || 
                         error.message.includes('not set') ? 400 : 500;
      
      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }
  
  /**
   * Get deposit request history for a property
   */
  async getDepositRequests(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const propertyId = req.query.propertyId as string;
    
    if (!propertyId) {
      res.status(400).json({
        success: false,
        message: 'Property ID is required'
      });
      return;
    }
    
    console.log(`[DepositRequestController] Getting deposit requests for property ${propertyId}`);
    
    try {
      // Use imported supabaseAdmin instead of req.supabaseAdmin
      const { data: depositRequests, error } = await supabaseAdmin
        .from('deposit_requests')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Error fetching deposit requests: ${error.message}`);
      }
      
      res.status(200).json({
        success: true,
        message: 'Deposit requests retrieved successfully',
        data: depositRequests
      });
    } catch (error: any) {
      console.error(`[DepositRequestController] Error getting deposit requests: ${error.message}`);
      
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
} 