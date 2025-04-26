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
 * Makes an authenticated request to the Next.js API route
 */
export const fetchFromApi = async (endpoint: string, options: RequestInit = {}) => {
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
    console.log(`Making authenticated request to: /api${endpoint}`);
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`API request failed with status ${response.status}:`, errorData);
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

/**
 * Get all properties
 */
export const getProperties = async () => {
  return fetchFromApi('/properties');
};

/**
 * Get a property by ID
 */
export const getProperty = async (id: string) => {
  return fetchFromApi(`/properties/${id}`);
};

/**
 * Create a new property
 */
export const createProperty = async (propertyData: any) => {
  return fetchFromApi('/properties', {
    method: 'POST',
    body: JSON.stringify(propertyData)
  });
};

/**
 * Update a property
 */
export const updateProperty = async (id: string, propertyData: any) => {
  return fetchFromApi(`/properties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(propertyData)
  });
};

/**
 * Delete a property
 */
export const deleteProperty = async (id: string) => {
  return fetchFromApi(`/properties/${id}`, {
    method: 'DELETE'
  });
};

/**
 * Get property room images
 */
export const getPropertyImages = async (propertyId: string) => {
  console.log(`Fetching property images for propertyId: ${propertyId}`);
  return fetchFromApi(`/upload/property/${propertyId}/images`);
};

/**
 * Get property documents
 */
export const getPropertyDocuments = async (propertyId: string) => {
  console.log(`Fetching property documents for propertyId: ${propertyId}`);
  return fetchFromApi(`/documents/${propertyId}`);
};

/**
 * Delete a property document
 */
export const deletePropertyDocument = async (documentPath: string) => {
  return fetchFromApi(`/documents/${documentPath}`, {
    method: 'DELETE'
  });
};

/**
 * Delete a property image
 */
export const deletePropertyImage = async (propertyId: string, imagePath: string) => {
  return fetchFromApi(`/upload/image?propertyId=${propertyId}`, {
    method: 'DELETE',
    body: JSON.stringify({ imagePath })
  });
};

/**
 * Test the backend connection with an authenticated request
 * This calls the /protected endpoint which requires authentication
 */
export const testBackendConnection = async () => {
  try {
    const data = await fetchFromApi('/protected');
    console.log('Backend connection successful:', data);
    return data;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    throw error;
  }
}; 