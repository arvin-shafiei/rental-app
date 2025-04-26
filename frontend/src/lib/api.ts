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
 * Update an existing property
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
 * Scan a contract document
 * @param documentPath - Either a path to an existing document or a File object
 */
  export const scanContractDocument = async (documentPath: string | File) => {
    if (typeof documentPath === 'string') {
      // For existing documents, send the path
      return fetchFromApi('/contracts/scan', {
        method: 'POST',
        body: JSON.stringify({ documentPath })
      });
    } else {
      // For new uploads, use FormData
      const formData = new FormData();
    formData.append('document', documentPath);
    
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch('/api/contracts/scan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Contract scan failed with status ${response.status}`);
    }
    
    return await response.json();
  }
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

/**
 * Get users for a property
 */
export const getPropertyUsers = async (propertyId: string) => {
  return fetchFromApi(`/property-users?propertyId=${propertyId}`);
};

/**
 * Add a user to a property
 */
export const addUserToProperty = async (propertyId: string, userData: { user_id: string, user_role: string }) => {
  return fetchFromApi(`/property-users?propertyId=${propertyId}`, {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

/**
 * Remove a user from a property
 */
export const removeUserFromProperty = async (propertyId: string, userId: string) => {
  return fetchFromApi(`/property-users/${propertyId}/${userId}`, {
    method: 'DELETE'
  });
};

/**
 * Look up a user by email
 */
export const lookupUserByEmail = async (email: string) => {
  return fetchFromApi(`/users/lookup?email=${encodeURIComponent(email)}`);
}; 