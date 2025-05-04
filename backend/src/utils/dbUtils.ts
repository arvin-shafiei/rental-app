import { supabaseAdmin } from '../services/supabase';

/**
 * Generic database utility functions for common operations
 */
export class DbUtils {
  /**
   * Fetch a record by ID from a specific table
   */
  static async getById<T = any>(table: string, id: string, column: string = 'id'): Promise<T | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .eq(column, id)
        .single();
      
      if (error) {
        console.error(`[DbUtils] Error fetching ${table} by ${column}: ${error.message}`);
        throw new Error(`Error fetching ${table}: ${error.message}`);
      }
      
      return data as T;
    } catch (error: any) {
      console.error(`[DbUtils] Unexpected error in getById: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Fetch all records for a property
   */
  static async getByPropertyId<T = any>(
    table: string, 
    propertyId: string, 
    orderColumn: string = 'created_at', 
    ascending: boolean = false
  ): Promise<T[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .eq('property_id', propertyId)
        .order(orderColumn, { ascending });
      
      if (error) {
        console.error(`[DbUtils] Error fetching ${table} for property: ${error.message}`);
        throw new Error(`Error fetching ${table}: ${error.message}`);
      }
      
      return data as T[] || [];
    } catch (error: any) {
      console.error(`[DbUtils] Unexpected error in getByPropertyId: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Insert a record and return the created record
   */
  static async insert<T = any, I = any>(table: string, data: I): Promise<T> {
    try {
      const { data: record, error } = await supabaseAdmin
        .from(table)
        .insert([data])
        .select()
        .single();
      
      if (error) {
        console.error(`[DbUtils] Error inserting into ${table}: ${error.message}`);
        throw new Error(`Error creating ${table}: ${error.message}`);
      }
      
      return record as T;
    } catch (error: any) {
      console.error(`[DbUtils] Unexpected error in insert: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update a record and return the updated record
   */
  static async update<T = any, U = any>(table: string, id: string, data: U): Promise<T> {
    try {
      const { data: record, error } = await supabaseAdmin
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error(`[DbUtils] Error updating ${table}: ${error.message}`);
        throw new Error(`Error updating ${table}: ${error.message}`);
      }
      
      return record as T;
    } catch (error: any) {
      console.error(`[DbUtils] Unexpected error in update: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Delete a record
   */
  static async delete(table: string, id: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`[DbUtils] Error deleting from ${table}: ${error.message}`);
        throw new Error(`Error deleting ${table}: ${error.message}`);
      }
    } catch (error: any) {
      console.error(`[DbUtils] Unexpected error in delete: ${error.message}`);
      throw error;
    }
  }
} 