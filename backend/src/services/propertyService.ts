import { supabase, supabaseAdmin } from './supabase';
import { Property, CreatePropertyDTO, UpdatePropertyDTO } from '../types/property';
import { Logger } from '../utils/loggerUtils';
import { DbUtils } from '../utils/dbUtils';

export class PropertyService {
  private logger = new Logger('PropertyService');
  
  /**
   * Get all properties for a user
   * This includes properties they own and properties they're associated with as tenants
   */
  async getUserProperties(userId: string): Promise<Property[]> {
    this.logger.methodStart('getUserProperties', { userId });
    
    try {
      // First, get properties owned by the user
      const { data: ownedProperties, error: ownedError } = await supabaseAdmin
        .from('properties')
        .select('*')
        .eq('user_id', userId);
        
      if (ownedError) throw ownedError;
      
      // Second, get properties the user has access to via property_users
      const { data: propertyUsers, error: accessError } = await supabaseAdmin
        .from('property_users')
        .select('property_id')
        .eq('user_id', userId);
        
      if (accessError) throw accessError;
      
      // If there are no properties the user has access to, just return owned properties
      if (propertyUsers.length === 0) {
        this.logger.info(`Found ${ownedProperties?.length || 0} properties for user`);
        return ownedProperties || [];
      }
      
      // Get property IDs the user has access to
      const accessPropertyIds = propertyUsers.map(item => item.property_id);
      
      // Get the associated properties
      const { data: accessProperties, error: propertiesError } = await supabaseAdmin
        .from('properties')
        .select('*')
        .in('id', accessPropertyIds);
        
      if (propertiesError) throw propertiesError;
      
      // Combine owned properties and access properties, removing duplicates
      const combinedProperties = [
        ...(ownedProperties || []),
        ...(accessProperties || [])
      ];
      
      // Remove duplicates by ID
      const uniqueProperties = Array.from(
        new Map(combinedProperties.map(item => [item.id, item])).values()
      );
      
      this.logger.info(`Found ${uniqueProperties.length} properties for user`);
      return uniqueProperties;
    } catch (error: any) {
      this.logger.methodError('getUserProperties', error);
      throw new Error(`Error fetching properties: ${error.message}`);
    }
  }

  /**
   * Get a single property by ID
   */
  async getPropertyById(propertyId: string, userId: string): Promise<Property | null> {
    this.logger.methodStart('getPropertyById', { propertyId, userId });
    
    try {
      // First, check if the user is the owner of the property
      const { data: ownedProperty, error: ownedError } = await supabaseAdmin
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('user_id', userId)
        .maybeSingle();
        
      // If this is the user's property, return it
      if (ownedProperty) {
        return ownedProperty;
      }
      
      // If not found as owner, check if the user has access via property_users
      const { data: propertyUser, error: accessError } = await supabaseAdmin
        .from('property_users')
        .select('*')
        .eq('property_id', propertyId)
        .eq('user_id', userId)
        .maybeSingle();
        
      // If the user doesn't have access, return null
      if (!propertyUser) {
        return null;
      }
      
      // The user has access, so get the property details
      return await DbUtils.getById<Property>('properties', propertyId);
    } catch (error: any) {
      this.logger.methodError('getPropertyById', error);
      throw new Error(`Error fetching property: ${error.message}`);
    }
  }

  /**
   * Create a new property (using service role for security)
   */
  async createProperty(userId: string, propertyData: CreatePropertyDTO): Promise<Property> {
    this.logger.methodStart('createProperty', { 
      userId,
      propertyData: this.logger.sanitizeParams(propertyData)
    });
    
    try {
      const property = await DbUtils.insert<Property>('properties', { 
        ...propertyData, 
        user_id: userId 
      });
      
      this.logger.info(`Successfully created property with id: ${property.id}`);
      // Note: The property owner is automatically added to property_users table by a database trigger
      
      return property;
    } catch (error: any) {
      this.logger.methodError('createProperty', error);
      throw new Error(`Error creating property: ${error.message}`);
    }
  }

  /**
   * Update an existing property (using service role for security)
   */
  async updateProperty(userId: string, propertyData: UpdatePropertyDTO): Promise<Property> {
    this.logger.methodStart('updateProperty', { 
      userId,
      propertyId: propertyData.id,
      propertyData: this.logger.sanitizeParams(propertyData)
    });
    
    try {
      // Verify the property belongs to the user first
      const existingProperty = await this.getPropertyById(propertyData.id, userId);
      
      if (!existingProperty) {
        throw new Error('Property not found or you do not have permission to update it');
      }
      
      // Remove id from the update data
      const { id, ...updateData } = propertyData;
      
      // Update using DbUtils
      const property = await DbUtils.update<Property>('properties', id, updateData);
      
      this.logger.info(`Successfully updated property: ${id}`);
      return property;
    } catch (error: any) {
      this.logger.methodError('updateProperty', error);
      throw error; // Preserve the original error
    }
  }

  /**
   * Delete a property
   */
  async deleteProperty(propertyId: string, userId: string): Promise<void> {
    this.logger.methodStart('deleteProperty', { propertyId, userId });
    
    try {
      // Verify the property belongs to the user first
      const existingProperty = await this.getPropertyById(propertyId, userId);
      
      if (!existingProperty) {
        throw new Error('Property not found or you do not have permission to delete it');
      }
      
      // Delete using DbUtils
      await DbUtils.delete('properties', propertyId);
      
      this.logger.info(`Successfully deleted property: ${propertyId}`);
      // Note: property_users records are automatically deleted by CASCADE constraint
    } catch (error: any) {
      this.logger.methodError('deleteProperty', error);
      throw error; // Preserve the original error
    }
  }
} 