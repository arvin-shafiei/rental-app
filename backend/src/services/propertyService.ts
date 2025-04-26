import { supabase, supabaseAdmin } from './supabase';
import { Property, CreatePropertyDTO, UpdatePropertyDTO } from '../types/property';

export class PropertyService {
  /**
   * Get all properties for a user
   * This includes properties they own and properties they're associated with as tenants
   */
  async getUserProperties(userId: string): Promise<Property[]> {
    console.log(`[PropertyService] Fetching properties for user: ${userId}`);
    
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
        console.log(`[PropertyService] Found ${ownedProperties?.length || 0} properties for user`);
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
      
      console.log(`[PropertyService] Found ${uniqueProperties.length} properties for user`);
      return uniqueProperties;
    } catch (error: any) {
      console.error(`[PropertyService] Error fetching properties: ${error.message}`);
      throw new Error(`Error fetching properties: ${error.message}`);
    }
  }

  /**
   * Get a single property by ID
   */
  async getPropertyById(propertyId: string, userId: string): Promise<Property | null> {
    console.log(`[PropertyService] Fetching property: ${propertyId} for user: ${userId}`);
    
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
      const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
        
      if (propertyError) {
        if (propertyError.code === 'PGRST116') { // No rows returned
          console.log(`[PropertyService] No property found with id: ${propertyId}`);
          return null;
        }
        throw propertyError;
      }
      
      return property;
    } catch (error: any) {
      console.error(`[PropertyService] Error fetching property: ${error.message}`);
      throw new Error(`Error fetching property: ${error.message}`);
    }
  }

  /**
   * Create a new property (using service role for security)
   */
  async createProperty(userId: string, propertyData: CreatePropertyDTO): Promise<Property> {
    console.log(`[PropertyService] Creating property for user: ${userId}`);
    
    // Use supabaseAdmin with service role key for elevated permissions
    const { data: property, error: createError } = await supabaseAdmin
      .from('properties')
      .insert([{ ...propertyData, user_id: userId }])
      .select()
      .single();
    
    if (createError) {
      console.error(`[PropertyService] Error creating property: ${createError.message}`);
      throw new Error(`Error creating property: ${createError.message}`);
    }
    
    console.log(`[PropertyService] Successfully created property with id: ${property.id}`);
    // Note: The property owner is automatically added to property_users table by a database trigger
    
    return property;
  }

  /**
   * Update an existing property (using service role for security)
   */
  async updateProperty(userId: string, propertyData: UpdatePropertyDTO): Promise<Property> {
    // Verify the property belongs to the user first
    const existingProperty = await this.getPropertyById(propertyData.id, userId);
    
    if (!existingProperty) {
      throw new Error('Property not found or you do not have permission to update it');
    }
    
    // Remove id from the update data
    const { id, ...updateData } = propertyData;
    
    console.log(`[PropertyService] Updating property: ${id} for user: ${userId}`);
    
    // Update the property with service role (backend only)
    const { data: property, error } = await supabaseAdmin
      .from('properties')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error(`[PropertyService] Error updating property: ${error.message}`);
      throw new Error(`Error updating property: ${error.message}`);
    }
    
    console.log(`[PropertyService] Successfully updated property: ${id}`);
    return property;
  }

  /**
   * Delete a property
   */
  async deleteProperty(propertyId: string, userId: string): Promise<void> {
    // Verify the property belongs to the user first
    const existingProperty = await this.getPropertyById(propertyId, userId);
    
    if (!existingProperty) {
      throw new Error('Property not found or you do not have permission to delete it');
    }
    
    console.log(`[PropertyService] Deleting property: ${propertyId}`);
    
    const { error } = await supabaseAdmin
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .eq('user_id', userId);
    
    if (error) {
      console.error(`[PropertyService] Error deleting property: ${error.message}`);
      throw new Error(`Error deleting property: ${error.message}`);
    }
    
    console.log(`[PropertyService] Successfully deleted property: ${propertyId}`);
    // Note: property_users records are automatically deleted by CASCADE constraint
  }
} 