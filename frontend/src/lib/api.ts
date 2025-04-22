import { supabase } from './supabase/client';

// Get the backend API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!API_URL) {
  console.warn('Backend API URL is not defined in environment variables');
}

/**
 * Helper function to get the current session token
 */
const getAuthToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

/**
 * Makes an authenticated request to the backend API
 */
export const fetchFromBackend = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  // Add authorization header
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Backend API request failed:', error);
    throw error;
  }
};

/**
 * Test the backend connection with an authenticated request
 * This calls the /protected endpoint which requires authentication
 */
export const testBackendConnection = async () => {
  try {
    const data = await fetchFromBackend('/protected');
    console.log('Backend connection successful:', data);
    return data;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    throw error;
  }
}; 