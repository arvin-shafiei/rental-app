import { Request, Response } from 'express';
import { PropertyUserService } from '../services/propertyUserService';
import { CreatePropertyUserDTO, PropertyUserRole } from '../types/property';
import { InvitationService, InvitationData } from '../services/invitationService';

// Initialize the services
const propertyUserService = new PropertyUserService();
const invitationService = new InvitationService();

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
      // Check if it's an email-based invitation
      if (req.body.email) {
        // Get property details to include in the invitation
        const { data: property, error: propertyError } = await propertyUserService.getPropertyDetails(propertyId);
        
        if (propertyError || !property) {
          console.error(`[PropertyUserController] Error fetching property details: ${propertyError?.message || 'Property not found'}`);
          res.status(404).json({
            success: false,
            message: 'Property not found',
            error: propertyError?.message || 'Property not found'
          });
          return;
        }
        
        // Get owner details
        const { data: owner, error: ownerError } = await propertyUserService.getUserDetails(userId);
        
        if (ownerError || !owner) {
          console.error(`[PropertyUserController] Error fetching owner details: ${ownerError?.message || 'Owner not found'}`);
          res.status(404).json({
            success: false,
            message: 'Owner not found',
            error: ownerError?.message || 'Owner not found'
          });
          return;
        }
        
        // Create invitation data
        const userRole = req.body.user_role || 'tenant';
        const invitationData: InvitationData = {
          propertyId: propertyId,
          propertyName: property.name,
          ownerName: owner.display_name || owner.email || 'Property Owner',
          userEmail: req.body.email,
          userRole: userRole
        };
        
        // Send invitation email
        const token = await invitationService.createInvitation(invitationData);
        
        res.status(201).json({
          success: true,
          message: 'Invitation sent successfully',
          data: { token }
        });
      } else {
        // Existing direct user addition flow
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
      }
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

  /**
   * Accept an invitation to join a property
   */
  async acceptInvitation(req: Request, res: Response): Promise<void> {
    const token = req.body.token;
    const currentUserId = (req as any).user?.id;
    
    console.log(`[PropertyUserController] Accepting invitation with token: ${token} for user: ${currentUserId}`);
    
    if (!token) {
      res.status(400).json({
        success: false,
        message: 'Token is required'
      });
      return;
    }
    
    try {
      // Verify and accept the invitation
      const { propertyId, userId, role } = await invitationService.acceptInvitation(token);
      
      // Add the user to the property
      const propertyUserData: CreatePropertyUserDTO = {
        property_id: propertyId,
        user_id: currentUserId || userId, // Use the current authenticated user if available
        user_role: role as PropertyUserRole
      };
      
      const propertyUser = await propertyUserService.addUserToProperty(propertyUserData);
      
      res.status(200).json({
        success: true,
        message: 'Invitation accepted successfully',
        data: {
          propertyId,
          role
        }
      });
    } catch (error: any) {
      console.error(`[PropertyUserController] Error accepting invitation: ${error.message}`);
      res.status(400).json({
        success: false,
        message: 'Error accepting invitation',
        error: error.message
      });
    }
  }
} 