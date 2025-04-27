import { supabase, supabaseAdmin } from './supabase';

interface CheckItem {
  text: string;
  checked: boolean;
}

interface CreateAgreementDTO {
  title: string;
  propertyId: string;
  checkItems: CheckItem[];
}

interface UpdateAgreementDTO {
  id: string;
  title?: string;
  checkItems?: CheckItem[];
}

interface Agreement {
  id: string;
  title: string;
  property_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  check_items: CheckItem[];
  property?: {
    id: string;
    name?: string;
    address: string;
  };
}

export class AgreementService {
  /**
   * Get all agreements
   * Optionally filter by property ID
   */
  async getAgreements(userId: string, propertyId?: string): Promise<Agreement[]> {
    console.log(`[AgreementService] Fetching agreements for user: ${userId}${propertyId ? `, property: ${propertyId}` : ''}`);
    
    try {
      let query = supabaseAdmin
        .from('agreements')
        .select(`
          *,
          property:properties(id, name, address)
        `);

      // Filter by property if provided
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(`[AgreementService] Error fetching agreements: ${error.message}`);
        throw new Error(`Error fetching agreements: ${error.message}`);
      }

      console.log(`[AgreementService] Found ${data?.length || 0} agreements`);
      return data || [];
    } catch (error: any) {
      console.error(`[AgreementService] Error in getAgreements: ${error.message}`);
      throw new Error(`Error fetching agreements: ${error.message}`);
    }
  }

  /**
   * Get a specific agreement by ID
   */
  async getAgreementById(agreementId: string, userId: string): Promise<Agreement | null> {
    console.log(`[AgreementService] Fetching agreement: ${agreementId} for user: ${userId}`);
    
    try {
      const { data, error } = await supabaseAdmin
        .from('agreements')
        .select(`
          *,
          property:properties(id, name, address)
        `)
        .eq('id', agreementId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          console.log(`[AgreementService] No agreement found with id: ${agreementId}`);
          return null;
        }
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error(`[AgreementService] Error fetching agreement: ${error.message}`);
      throw new Error(`Error fetching agreement: ${error.message}`);
    }
  }

  /**
   * Verify if user has access to a property (is owner)
   */
  async verifyPropertyOwnership(propertyId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('property_users')
        .select('id, user_role')
        .eq('property_id', propertyId)
        .eq('user_id', userId)
        .eq('user_role', 'owner')
        .single();

      if (error || !data) {
        console.log(`[AgreementService] User ${userId} does not have owner access to property ${propertyId}`);
        return false;
      }

      return true;
    } catch (error: any) {
      console.error(`[AgreementService] Error verifying property ownership: ${error.message}`);
      return false;
    }
  }

  /**
   * Create a new agreement
   */
  async createAgreement(userId: string, agreementData: CreateAgreementDTO): Promise<Agreement> {
    console.log(`[AgreementService] Creating agreement for property: ${agreementData.propertyId}`);
    
    try {
      // Verify the user has owner access to the property
      const hasAccess = await this.verifyPropertyOwnership(agreementData.propertyId, userId);
      if (!hasAccess) {
        throw new Error('You do not have permission to create agreements for this property');
      }

      const { data, error } = await supabaseAdmin
        .from('agreements')
        .insert({
          title: agreementData.title,
          property_id: agreementData.propertyId,
          created_by: userId,
          check_items: agreementData.checkItems
        })
        .select()
        .single();

      if (error) {
        console.error(`[AgreementService] Error creating agreement: ${error.message}`);
        throw new Error(`Error creating agreement: ${error.message}`);
      }

      console.log(`[AgreementService] Successfully created agreement with id: ${data.id}`);
      return data;
    } catch (error: any) {
      console.error(`[AgreementService] Error in createAgreement: ${error.message}`);
      throw new Error(error.message || 'Error creating agreement');
    }
  }

  /**
   * Update an existing agreement
   */
  async updateAgreement(userId: string, agreementData: UpdateAgreementDTO): Promise<Agreement> {
    console.log(`[AgreementService] Updating agreement: ${agreementData.id}`);
    
    try {
      // Fetch the agreement to check ownership
      const { data: existingAgreement, error: fetchError } = await supabaseAdmin
        .from('agreements')
        .select('id, property_id, created_by')
        .eq('id', agreementData.id)
        .single();

      if (fetchError || !existingAgreement) {
        throw new Error('Agreement not found');
      }

      // Check if user is the creator or has access to the property
      const isCreator = existingAgreement.created_by === userId;
      let isOwner = false;
      
      if (!isCreator) {
        // Check if user is the property owner
        isOwner = await this.verifyPropertyOwnership(existingAgreement.property_id, userId);
      }

      if (!isCreator && !isOwner) {
        throw new Error('You do not have permission to update this agreement');
      }

      // Prepare update data
      const updateData: any = {};
      if (agreementData.title) updateData.title = agreementData.title;
      if (agreementData.checkItems) updateData.check_items = agreementData.checkItems;

      // Update the agreement
      const { data, error } = await supabaseAdmin
        .from('agreements')
        .update(updateData)
        .eq('id', agreementData.id)
        .select()
        .single();

      if (error) {
        console.error(`[AgreementService] Error updating agreement: ${error.message}`);
        throw new Error(`Error updating agreement: ${error.message}`);
      }

      console.log(`[AgreementService] Successfully updated agreement: ${agreementData.id}`);
      return data;
    } catch (error: any) {
      console.error(`[AgreementService] Error in updateAgreement: ${error.message}`);
      throw new Error(error.message || 'Error updating agreement');
    }
  }

  /**
   * Delete an agreement
   */
  async deleteAgreement(agreementId: string, userId: string): Promise<void> {
    console.log(`[AgreementService] Deleting agreement: ${agreementId}`);
    
    try {
      // Fetch the agreement to check ownership
      const { data: existingAgreement, error: fetchError } = await supabaseAdmin
        .from('agreements')
        .select('id, property_id, created_by')
        .eq('id', agreementId)
        .single();

      if (fetchError || !existingAgreement) {
        throw new Error('Agreement not found');
      }

      // Check if user is the creator or has access to the property
      const isCreator = existingAgreement.created_by === userId;
      let isOwner = false;
      
      if (!isCreator) {
        // Check if user is the property owner
        isOwner = await this.verifyPropertyOwnership(existingAgreement.property_id, userId);
      }

      if (!isCreator && !isOwner) {
        throw new Error('You do not have permission to delete this agreement');
      }

      // Delete the agreement
      const { error } = await supabaseAdmin
        .from('agreements')
        .delete()
        .eq('id', agreementId);

      if (error) {
        console.error(`[AgreementService] Error deleting agreement: ${error.message}`);
        throw new Error(`Error deleting agreement: ${error.message}`);
      }

      console.log(`[AgreementService] Successfully deleted agreement: ${agreementId}`);
    } catch (error: any) {
      console.error(`[AgreementService] Error in deleteAgreement: ${error.message}`);
      throw new Error(error.message || 'Error deleting agreement');
    }
  }
} 