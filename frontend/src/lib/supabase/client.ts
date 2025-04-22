// Import the createClient function directly from @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';

// Get the Supabase URL and Anon Key from environment variables
// The `process.env.NEXT_PUBLIC_...` syntax is how Next.js exposes environment variables to the browser
// Variables MUST start with NEXT_PUBLIC_ to be available in the browser for security reasons.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Check if the environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL or Anon Key is missing. Make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}); 