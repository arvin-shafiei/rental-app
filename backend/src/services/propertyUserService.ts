import { supabase, supabaseAdmin } from './supabase';
import { PropertyUser, CreatePropertyUserDTO, PropertyUserRole } from '../types/property';

export class PropertyUserService {
  /**
   * Get all users associated with a property
   */
  async getPropertyUsers(propertyId: string): Promise<PropertyUser[]> {
    console.log(`[PropertyUserService] Fetching users for property: ${propertyId}`);
    
    // Join with profiles to get user information
    const { data, error } = await supabaseAdmin
      .from('property_users')
      .select(`
        *,
        profile:profiles(id, display_name, email, avatar_url)
      `)
      .eq('property_id', propertyId);
    
    if (error) {
      console.error(`[PropertyUserService] Error fetching property users: ${error.message}`);
      throw new Error(`Error fetching property users: ${error.message}`);
    }
    
    console.log(`[PropertyUserService] Found ${data?.length || 0} users for property ${propertyId}`);
    return data || [];
  }

  /**
   * Get all properties a user has access to
   * This includes properties they own and properties they're assigned to as tenants
   */
  async getUserProperties(userId: string): Promise<string[]> {
    console.log(`[PropertyUserService] Fetching property IDs for user: ${userId}`);
    
    const { data, error } = await supabaseAdmin
      .from('property_users')
      .select('property_id')
      .eq('user_id', userId);
    
    if (error) {
      console.error(`[PropertyUserService] Error fetching user properties: ${error.message}`);
      throw new Error(`Error fetching user properties: ${error.message}`);
    }
    
    const propertyIds = data ? data.map(item => item.property_id) : [];
    console.log(`[PropertyUserService] Found ${propertyIds.length} properties for user ${userId}`);
    return propertyIds;
  }

  /**
   * Add a user to a property
   * Note: Property owners are automatically added through a database trigger
   */
  async addUserToProperty(propertyData: CreatePropertyUserDTO): Promise<PropertyUser> {
    console.log(`[PropertyUserService] Adding user ${propertyData.user_id} to property ${propertyData.property_id} as ${propertyData.user_role}`);
    
    // Check if the user is already associated with this property
    const { data: existingAssociation } = await supabaseAdmin
      .from('property_users')
      .select('*')
      .eq('property_id', propertyData.property_id)
      .eq('user_id', propertyData.user_id)
      .maybeSingle();
    
    if (existingAssociation) {
      console.log(`[PropertyUserService] User is already associated with this property`);
      return existingAssociation;
    }
    
    // Create the association
    const { data, error } = await supabaseAdmin
      .from('property_users')
      .insert([propertyData])
      .select()
      .single();
    
    if (error) {
      console.error(`[PropertyUserService] Error adding user to property: ${error.message}`);
      throw new Error(`Error adding user to property: ${error.message}`);
    }
    
    console.log(`[PropertyUserService] Successfully added user to property`);
    return data;
  }

  /**
   * Remove a user from a property
   */
  async removeUserFromProperty(propertyId: string, userId: string): Promise<void> {
    console.log(`[PropertyUserService] Removing user ${userId} from property ${propertyId}`);
    
    const { error } = await supabaseAdmin
      .from('property_users')
      .delete()
      .eq('property_id', propertyId)
      .eq('user_id', userId);
    
    if (error) {
      console.error(`[PropertyUserService] Error removing user from property: ${error.message}`);
      throw new Error(`Error removing user from property: ${error.message}`);
    }
    
    console.log(`[PropertyUserService] Successfully removed user from property`);
  }

  /**
   * Check if a user has a specific role for a property
   */
  async checkUserRole(propertyId: string, userId: string, role: string): Promise<boolean> {
    console.log(`[PropertyUserService] Checking if user ${userId} has role ${role} for property ${propertyId}`);
    
    const { data, error } = await supabaseAdmin
      .from('property_users')
      .select('*')
      .eq('property_id', propertyId)
      .eq('user_id', userId)
      .eq('user_role', role)
      .maybeSingle();
    
    if (error) {
      console.error(`[PropertyUserService] Error checking user role: ${error.message}`);
      throw new Error(`Error checking user role: ${error.message}`);
    }
    
    const hasRole = !!data;
    console.log(`[PropertyUserService] User ${userId} ${hasRole ? 'has' : 'does not have'} role ${role} for property ${propertyId}`);
    return hasRole;
  }

  /**
   * Get property details by ID
   */
  async getPropertyDetails(propertyId: string): Promise<{ data: any, error: any }> {
    console.log(`[PropertyUserService] Getting details for property: ${propertyId}`);
    
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .maybeSingle();
    
    if (error) {
      console.error(`[PropertyUserService] Error fetching property details: ${error.message}`);
      return { data: null, error };
    }
    
    console.log(`[PropertyUserService] Found property details for ${propertyId}`);
    return { data, error: null };
  }

  /**
   * Get user details by ID
   */
  async getUserDetails(userId: string): Promise<{ data: any, error: any }> {
    console.log(`[PropertyUserService] Getting details for user: ${userId}`);
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error(`[PropertyUserService] Error fetching user details: ${error.message}`);
      return { data: null, error };
    }
    
    console.log(`[PropertyUserService] Found user details for ${userId}`);
    return { data, error: null };
  }
}