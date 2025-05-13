import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Check if environment variables are properly set
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase environment variables not properly set');
  console.error('Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in your .env file');
}

// Create the Supabase client with the service role key for admin access
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper function to validate a user session token
export const validateToken = async (token: string) => {
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Error validating user token:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error validating user token:', error);
    return null;
  }
};

// Export other Supabase-related utilities here as needed 