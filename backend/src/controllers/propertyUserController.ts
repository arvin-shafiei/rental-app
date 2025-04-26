import { Request, Response } from 'express';
import { PropertyUserService } from '../services/propertyUserService';
import { CreatePropertyUserDTO } from '../types/property';

// Initialize the property user service
const propertyUserService = new PropertyUserService();

export class PropertyUserController {
  /**
   * Get all users for a specific property
   */
  async getPropertyUsers(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const propertyId = req.params.propertyId;
    
    console.log(`[PropertyUserController] Getting users for property: ${propertyId} by user: ${userId}`);
    
    try {
      const users = await propertyUserService.getPropertyUsers(propertyId);
      
      res.status(200).json({
        success: true,
        message: 'Property users retrieved successfully',
        data: users
      });
    } catch (error: any) {
      console.error(`[PropertyUserController] Error fetching property users: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error retrieving property users',
        error: error.message
      });
    }
  }

  /**
   * Add a user to a property
   */
  async addUserToProperty(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const propertyId = req.params.propertyId;
    
    console.log(`[PropertyUserController] Adding user to property: ${propertyId} by user: ${userId}`);
    
    try {
      const propertyUserData: CreatePropertyUserDTO = {
        property_id: propertyId,
        user_id: req.body.user_id,
        user_role: req.body.user_role
      };
      
      const propertyUser = await propertyUserService.addUserToProperty(propertyUserData);
      
      res.status(201).json({
        success: true,
        message: 'User added to property successfully',
        data: propertyUser
      });
    } catch (error: any) {
      console.error(`[PropertyUserController] Error adding user to property: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error adding user to property',
        error: error.message
      });
    }
  }

  /**
   * Remove a user from a property
   */
  async removeUserFromProperty(req: Request, res: Response): Promise<void> {
    const requesterId = (req as any).user?.id;
    const propertyId = req.params.propertyId;
    const userIdToRemove = req.params.userId;
    
    console.log(`[PropertyUserController] Removing user ${userIdToRemove} from property: ${propertyId} by user: ${requesterId}`);
    
    try {
      await propertyUserService.removeUserFromProperty(propertyId, userIdToRemove);
      
      res.status(200).json({
        success: true,
        message: 'User removed from property successfully'
      });
    } catch (error: any) {
      console.error(`[PropertyUserController] Error removing user from property: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error removing user from property',
        error: error.message
      });
    }
  }
} 