import { Request, Response } from 'express';
import { AgreementService } from '../services/agreementService';

// Initialize the agreement service
const agreementService = new AgreementService();

export class AgreementController {
  /**
   * Get all agreements with optional property filter
   */
  async getAgreements(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const { propertyId } = req.query;
    
    console.log(`[AgreementController] Getting agreements for user: ${userId}${propertyId ? `, property: ${propertyId}` : ''}`);
    
    try {
      const agreements = await agreementService.getAgreements(
        userId, 
        propertyId ? String(propertyId) : undefined
      );
      
      console.log(`[AgreementController] Found ${agreements.length} agreements`);
      
      res.status(200).json(agreements);
    } catch (error: any) {
      console.error(`[AgreementController] Error fetching agreements:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch agreements', 
        message: error.message 
      });
    }
  }

  /**
   * Get a specific agreement by ID
   */
  async getAgreementById(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const agreementId = req.params.id;
    
    console.log(`[AgreementController] Getting agreement ID ${agreementId} for user: ${userId}`);
    
    try {
      const agreement = await agreementService.getAgreementById(agreementId, userId);
      
      if (!agreement) {
        console.log(`[AgreementController] Agreement ${agreementId} not found`);
        res.status(404).json({ error: 'Agreement not found' });
        return;
      }
      
      console.log(`[AgreementController] Successfully retrieved agreement ${agreementId}`);
      
      res.status(200).json(agreement);
    } catch (error: any) {
      console.error(`[AgreementController] Error fetching agreement ${agreementId}:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch agreement', 
        message: error.message 
      });
    }
  }

  /**
   * Create a new agreement
   */
  async createAgreement(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const { title, propertyId, checkItems } = req.body;
    
    console.log(`[AgreementController] Creating agreement for property: ${propertyId}`);
    
    try {
      // Validate required fields
      if (!title || !propertyId || !checkItems || !Array.isArray(checkItems)) {
        res.status(400).json({ 
          error: 'Missing required fields: title, propertyId, and checkItems'
        });
        return;
      }
      
      const agreement = await agreementService.createAgreement(userId, {
        title,
        propertyId,
        checkItems
      });
      
      console.log(`[AgreementController] Agreement created successfully with ID: ${agreement.id}`);
      
      res.status(201).json(agreement);
    } catch (error: any) {
      console.error(`[AgreementController] Error creating agreement:`, error);
      
      if (error.message.includes('permission')) {
        res.status(403).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ 
        error: 'Failed to create agreement', 
        message: error.message 
      });
    }
  }

  /**
   * Update an existing agreement
   */
  async updateAgreement(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const agreementId = req.params.id;
    const { title, checkItems } = req.body;
    
    console.log(`[AgreementController] Updating agreement ${agreementId}`);
    
    try {
      // Validate required fields
      if ((!title && !checkItems) || (checkItems && !Array.isArray(checkItems))) {
        res.status(400).json({ error: 'Invalid update data' });
        return;
      }
      
      const agreement = await agreementService.updateAgreement(userId, {
        id: agreementId,
        title,
        checkItems
      });
      
      console.log(`[AgreementController] Agreement ${agreementId} updated successfully`);
      
      res.status(200).json(agreement);
    } catch (error: any) {
      console.error(`[AgreementController] Error updating agreement ${agreementId}:`, error);
      
      // Check for different types of errors
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.message.includes('permission')) {
        res.status(403).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ 
        error: 'Failed to update agreement', 
        message: error.message 
      });
    }
  }

  /**
   * Delete an agreement
   */
  async deleteAgreement(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const agreementId = req.params.id;
    
    console.log(`[AgreementController] Deleting agreement ${agreementId}`);
    
    try {
      await agreementService.deleteAgreement(agreementId, userId);
      
      console.log(`[AgreementController] Agreement ${agreementId} deleted successfully`);
      
      res.status(200).json({ message: 'Agreement deleted successfully' });
    } catch (error: any) {
      console.error(`[AgreementController] Error deleting agreement ${agreementId}:`, error);
      
      // Check for different types of errors
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }
      
      if (error.message.includes('permission')) {
        res.status(403).json({ error: error.message });
        return;
      }
      
      res.status(500).json({ 
        error: 'Failed to delete agreement', 
        message: error.message 
      });
    }
  }

  /**
   * Get an agreement for task update (with permission checks)
   * This helper method handles permission checks and returns the agreement
   */
  async getAgreementForTaskUpdate(agreementId: string, req: Request, res: Response): Promise<any> {
    const userId = (req as any).user?.id;
    
    try {
      // Get the agreement
      const agreement = await agreementService.getAgreementById(agreementId, userId);
      
      if (!agreement) {
        res.status(404).json({ error: 'Agreement not found' });
        return null;
      }
      
      // Check user's role for the property
      const propertyId = agreement.property_id;
      const propertyUsers = await agreementService.getPropertyUsers(propertyId);
      
      // Find the user's role
      const userPropertyAccess = propertyUsers.find(
        (pu: any) => pu.user_id === userId
      );
      
      if (!userPropertyAccess) {
        res.status(403).json({ error: 'You do not have access to this agreement' });
        return null;
      }
      
      // Store the user's role in the request for the route handler
      (req as any).propertyRole = userPropertyAccess.user_role;
      
      return agreement;
    } catch (error: any) {
      console.error(`[AgreementController] Error fetching agreement for task update:`, error);
      res.status(500).json({ 
        error: 'Failed to fetch agreement', 
        message: error.message 
      });
      return null;
    }
  }
  
  /**
   * Update only the tasks for an agreement
   * This helper method handles updating just the check items
   */
  async updateTasksOnly(agreementId: string, checkItems: any[], req: Request, res: Response): Promise<any> {
    const userId = (req as any).user?.id;
    
    try {
      // Update just the check items
      const updatedAgreement = await agreementService.updateAgreementTasks(
        agreementId,
        checkItems,
        userId
      );
      
      return updatedAgreement;
    } catch (error: any) {
      console.error(`[AgreementController] Error updating tasks:`, error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return null;
      }
      
      if (error.message.includes('permission')) {
        res.status(403).json({ error: error.message });
        return null;
      }
      
      res.status(500).json({ 
        error: 'Failed to update tasks', 
        message: error.message 
      });
      return null;
    }
  }
} 