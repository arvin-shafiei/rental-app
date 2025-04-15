// Import the function to create a Supabase client specifically for browser environments in Next.js
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

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
// The exclamation mark (!) after the variables tells TypeScript we are sure they are not null or undefined
// because we checked above.
// We wrap this in a function to ensure it's created only when needed, though createPagesBrowserClient often handles this.
// Using a constant export is also common.
export const supabase = createPagesBrowserClient({
  supabaseUrl,
  supabaseKey: supabaseAnonKey,
}); 