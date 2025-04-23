import { createClient } from '@supabase/supabase-js';

// Create a server-side Supabase client
export async function createServerSupabaseClient() {
  // Get Supabase URL and anon key from env variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  console.log('Creating server supabase client with URL:', supabaseUrl);

  // Create a simple client without cookie handling for direct API access
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

// Helper function to get session
export async function getSession() {
  try {
    console.log('Attempting to get session from browser cookie...');
    
    // We're in a server component/API route, so we need to create a new client
    const supabase = await createServerSupabaseClient();
    
    // Try to get the session (this will only work if the user is logged in from the browser)
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error.message);
      throw error;
    }
    
    if (!data.session) {
      console.log('No session found - user might need to log in');
      return null;
    }
    
    console.log('Session found, token retrieved');
    return data.session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
} 