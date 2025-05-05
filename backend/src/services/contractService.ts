import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { supabaseAdmin } from './supabase'; // Import the admin client

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

/**
 * Stores a contract analysis summary in the database
 * @param summaryData The contract analysis data to store
 * @param userId Optional user ID to associate with the summary
 * @returns The result of the database insert operation
 */
export async function storeContractSummary(summaryData: any, userId?: string) {
  try {
    // Check for valid Supabase connection
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('Supabase credentials missing. Skipping summary storage.');
      return { id: 'skipped', skipped: true };
    }
    
    // Get the user ID from auth context or use provided ID
    if (!userId) {
      try {
        const { data: authData } = await supabase.auth.getSession();
        userId = authData.session?.user.id;
        console.log('Using auth session user ID:', userId);
      } catch (authError) {
        console.warn('Could not get user ID from auth session:', authError);
      }
    }
    
    console.log(`Storing contract summary for user ID: ${userId || 'anonymous'}`);
    
    // Insert the summary into the contract_summaries table using admin client
    // to bypass RLS policies
    const { data, error } = await supabaseAdmin
      .from('contract_summaries')
      .insert({
        summary: summaryData,
        user_id: userId
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error storing contract summary:', error);
      // Continue execution even if storage fails
      return { id: 'failed', error };
    }

    console.log(`Successfully stored contract summary with ID: ${data?.id}`);
    return data;
    
  } catch (error: any) {
    console.error('Failed to store contract summary:', error);
    // Continue execution even if storage fails
    return { id: 'error', error: error.message };
  }
}

/**
 * Retrieves contract summaries with optional pagination
 * @param userId Optional user ID to filter summaries by
 * @param limit Maximum number of records to return
 * @param offset Number of records to skip
 * @returns List of contract summaries
 */
export async function getContractSummaries(userId?: string, limit = 10, offset = 0) {
  try {
    console.log(`Fetching contract summaries with userId: ${userId || 'none'}, limit: ${limit}, offset: ${offset}`);
    
    // Use supabaseAdmin to bypass RLS, similar to how storeContractSummary works
    let query = supabaseAdmin
      .from('contract_summaries')
      .select('*')
      .order('created_at', { ascending: false });
    
    // If userId is provided, filter by user
    if (userId) {
      console.log(`Filtering contract_summaries by user_id: ${userId}`);
      query = query.eq('user_id', userId);
    } else {
      console.log('No userId provided, returning all summaries (bypassing RLS)');
    }
    
    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error retrieving contract summaries:', error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} contract summaries`);
    
    // Print the user_id of each summary for debugging
    if (data && data.length > 0) {
      console.log('Summary user_ids:', data.map(summary => summary.user_id || 'null'));
    }
    
    return data;
  } catch (error) {
    console.error('Failed to retrieve contract summaries:', error);
    throw error;
  }
}

/**
 * Retrieves a specific contract summary by ID
 * @param id The UUID of the contract summary to retrieve
 * @returns The contract summary or null if not found
 */
export async function getContractSummaryById(id: string) {
  try {
    const { data, error } = await supabase
      .from('contract_summaries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error retrieving contract summary with ID ${id}:`, error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`Failed to retrieve contract summary with ID ${id}:`, error);
    throw error;
  }
} 