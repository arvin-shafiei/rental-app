/**
 * Returns the backend API URL based on environment
 */
export function getBackendUrl(): string {
  // Use environment variable if available, otherwise default to localhost
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
}

/**
 * Returns the Supabase URL
 */
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

/**
 * Returns the Supabase anon key
 */
export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
} 