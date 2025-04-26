import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and service role key from env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase URL or service role key is not defined in environment variables');
}

// Create a service client with service role key for admin access
// This has higher privileges and should ONLY be used in secure server contexts
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
}); 