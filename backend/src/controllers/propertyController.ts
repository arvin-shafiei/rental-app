import { Request, Response } from 'express';
import { PropertyService } from '../services/propertyService';
import { CreatePropertyDTO, UpdatePropertyDTO } from '../types/property';
import { BaseController } from '../utils/controllerUtils';
import { Logger } from '../utils/loggerUtils';

// Initialize the property service
const propertyService = new PropertyService();

export class PropertyController extends BaseController {
  private logger = new Logger('PropertyController');
  
  /**
   * Get all properties for the authenticated user
   */
  async getUserProperties(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    this.logger.methodStart('getUserProperties', { userId });
    
    try {
      const properties = await propertyService.getUserProperties(userId);
      
      this.logger.info(`Found ${properties.length} properties for user ${userId}`);
      
      this.sendSuccess(res, 'Properties retrieved successfully', properties);
    } catch (error: any) {
      this.logger.methodError('getUserProperties', error);
      this.sendError(res, 'Error retrieving properties', 500, error);
    }
  }

  /**
   * Get a specific property by ID
   */
  async getPropertyById(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const propertyId = req.params.id;
    
    this.logger.methodStart('getPropertyById', { userId, propertyId });
    
    try {
      const property = await propertyService.getPropertyById(propertyId, userId);
      
      if (!property) {
        this.logger.info(`Property ${propertyId} not found for user ${userId}`);
        this.sendError(res, 'Property not found', 404);
        return;
      }
      
      this.logger.info(`Successfully retrieved property ${propertyId}`);
      
      this.sendSuccess(res, 'Property retrieved successfully', property);
    } catch (error: any) {
      this.logger.methodError('getPropertyById', error);
      this.sendError(res, 'Error retrieving property', 500, error);
    }
  }

  /**
   * Create a new property
   */
  async createProperty(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    
    this.logger.methodStart('createProperty', { 
      userId,
      body: this.logger.sanitizeParams(req.body)
    });
    
    try {
      const propertyData: CreatePropertyDTO = req.body;
      
      // Validate required fields
      if (!propertyData.name || !propertyData.postcode) {
        this.logger.info('Validation failed: Missing name or postcode');
        this.sendError(res, 'Name and postcode are required', 400);
        return;
      }
      
      const property = await propertyService.createProperty(userId, propertyData);
      
      this.logger.info(`Property created successfully with ID: ${property.id}`);
      
      this.sendSuccess(res, 'Property created successfully', property, 201);
    } catch (error: any) {
      this.logger.methodError('createProperty', error);
      this.sendError(res, 'Error creating property', 500, error);
    }
  }

  /**
   * Update an existing property
   */
  async updateProperty(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const propertyId = req.params.id;
    
    this.logger.methodStart('updateProperty', { 
      userId, 
      propertyId,
      body: this.logger.sanitizeParams(req.body)
    });
    
    try {
      const propertyData: Partial<CreatePropertyDTO> = req.body;
      
      // Create update DTO
      const updateData: UpdatePropertyDTO = {
        id: propertyId,
        ...propertyData
      };
      
      const property = await propertyService.updateProperty(userId, updateData);
      
      this.logger.info(`Property ${propertyId} updated successfully`);
      
      this.sendSuccess(res, 'Property updated successfully', property);
    } catch (error: any) {
      this.logger.methodError('updateProperty', error);
      
      // Get appropriate status code
      const statusCode = this.getErrorStatusCode(error);
      
      this.sendError(res, error.message, statusCode, error);
    }
  }

  /**
   * Delete a property
   */
  async deleteProperty(req: Request, res: Response): Promise<void> {
    const userId = this.getUserId(req);
    const propertyId = req.params.id;
    
    this.logger.methodStart('deleteProperty', { userId, propertyId });
    
    try {
      await propertyService.deleteProperty(propertyId, userId);
      
      this.logger.info(`Property ${propertyId} deleted successfully`);
      
      this.sendSuccess(res, 'Property deleted successfully');
    } catch (error: any) {
      this.logger.methodError('deleteProperty', error);
      
      // Get appropriate status code
      const statusCode = this.getErrorStatusCode(error);
      
      this.sendError(res, error.message, statusCode, error);
    }
  }
} 