import { supabase, supabaseAdmin } from './supabase';
import { Property, CreatePropertyDTO, UpdatePropertyDTO } from '../types/property';

export class PropertyService {
  /**
   * Get all properties for a user
   */
  async getUserProperties(userId: string): Promise<Property[]> {
    console.log(`[PropertyService] Fetching properties for user: ${userId}`);
    
    // Use supabaseAdmin to bypass authentication requirements
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error(`[PropertyService] Error fetching properties: ${error.message}`);
      throw new Error(`Error fetching properties: ${error.message}`);
    }
    
    console.log(`[PropertyService] Found ${data?.length || 0} properties for user`);
    return data || [];
  }

  /**
   * Get a single property by ID
   */
  async getPropertyById(propertyId: string, userId: string): Promise<Property | null> {
    console.log(`[PropertyService] Fetching property: ${propertyId} for user: ${userId}`);
    
    // Use supabaseAdmin to bypass authentication requirements
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        console.log(`[PropertyService] No property found with id: ${propertyId}`);
        return null;
      }
      console.error(`[PropertyService] Error fetching property: ${error.message}`);
      throw new Error(`Error fetching property: ${error.message}`);
    }
    
    return data;
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
   * Delete a property (using service role for security)
   */
  async deleteProperty(propertyId: string, userId: string): Promise<void> {
    // Verify the property belongs to the user first
    const existingProperty = await this.getPropertyById(propertyId, userId);
    
    if (!existingProperty) {
      throw new Error('Property not found or you do not have permission to delete it');
    }
    
    console.log(`[PropertyService] Deleting property: ${propertyId} for user: ${userId}`);
    
    // Delete the property with service role (backend only)
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
  }
} 