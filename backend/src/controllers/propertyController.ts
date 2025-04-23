import { Request, Response } from 'express';
import { PropertyService } from '../services/propertyService';
import { CreatePropertyDTO, UpdatePropertyDTO } from '../types/property';

// Initialize the property service
const propertyService = new PropertyService();

export class PropertyController {
  /**
   * Get all properties for the authenticated user
   */
  async getUserProperties(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    console.log(`[PropertyController] Getting properties for user: ${userId}`);
    
    try {
      const user = (req as any).user;
      const properties = await propertyService.getUserProperties(user.id);
      
      console.log(`[PropertyController] Found ${properties.length} properties for user ${userId}`);
      
      res.status(200).json({
        success: true,
        message: 'Properties retrieved successfully',
        data: properties
      });
    } catch (error: any) {
      console.error(`[PropertyController] Error fetching properties for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving properties',
        error: error.message
      });
    }
  }

  /**
   * Get a specific property by ID
   */
  async getPropertyById(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const propertyId = req.params.id;
    
    console.log(`[PropertyController] Getting property ID ${propertyId} for user: ${userId}`);
    
    try {
      const user = (req as any).user;
      
      const property = await propertyService.getPropertyById(propertyId, user.id);
      
      if (!property) {
        console.log(`[PropertyController] Property ${propertyId} not found for user ${userId}`);
        res.status(404).json({
          success: false,
          message: 'Property not found'
        });
        return;
      }
      
      console.log(`[PropertyController] Successfully retrieved property ${propertyId}`);
      
      res.status(200).json({
        success: true,
        message: 'Property retrieved successfully',
        data: property
      });
    } catch (error: any) {
      console.error(`[PropertyController] Error fetching property ${propertyId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error retrieving property',
        error: error.message
      });
    }
  }

  /**
   * Create a new property
   */
  async createProperty(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    
    console.log(`[PropertyController] Attempting to create property for user: ${userId}`);
    console.log(`[PropertyController] Property data:`, JSON.stringify(req.body, null, 2));
    
    try {
      const user = (req as any).user;
      const propertyData: CreatePropertyDTO = req.body;
      
      // Validate required fields
      if (!propertyData.name || !propertyData.postcode) {
        console.log(`[PropertyController] Validation failed: Missing name or postcode`);
        res.status(400).json({
          success: false,
          message: 'Name and postcode are required'
        });
        return;
      }
      
      const property = await propertyService.createProperty(user.id, propertyData);
      
      console.log(`[PropertyController] Property created successfully with ID: ${property.id}`);
      
      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: property
      });
    } catch (error: any) {
      console.error(`[PropertyController] Error creating property for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Error creating property',
        error: error.message
      });
    }
  }

  /**
   * Update an existing property
   */
  async updateProperty(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const propertyId = req.params.id;
    
    console.log(`[PropertyController] Attempting to update property ${propertyId} for user: ${userId}`);
    console.log(`[PropertyController] Update data:`, JSON.stringify(req.body, null, 2));
    
    try {
      const user = (req as any).user;
      const propertyData: Partial<CreatePropertyDTO> = req.body;
      
      // Create update DTO
      const updateData: UpdatePropertyDTO = {
        id: propertyId,
        ...propertyData
      };
      
      const property = await propertyService.updateProperty(user.id, updateData);
      
      console.log(`[PropertyController] Property ${propertyId} updated successfully`);
      
      res.status(200).json({
        success: true,
        message: 'Property updated successfully',
        data: property
      });
    } catch (error: any) {
      console.error(`[PropertyController] Error updating property ${propertyId}:`, error);
      
      // Check for not found error
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Error updating property',
        error: error.message
      });
    }
  }

  /**
   * Delete a property
   */
  async deleteProperty(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user?.id;
    const propertyId = req.params.id;
    
    console.log(`[PropertyController] Attempting to delete property ${propertyId} for user: ${userId}`);
    
    try {
      const user = (req as any).user;
      
      await propertyService.deleteProperty(propertyId, user.id);
      
      console.log(`[PropertyController] Property ${propertyId} deleted successfully`);
      
      res.status(200).json({
        success: true,
        message: 'Property deleted successfully'
      });
    } catch (error: any) {
      console.error(`[PropertyController] Error deleting property ${propertyId}:`, error);
      
      // Check for not found error
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          message: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Error deleting property',
        error: error.message
      });
    }
  }
} 