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
    // Ensure the endpoint doesn't start with a slash if we're adding /api
    const apiEndpoint = endpoint.startsWith('/') ? `api${endpoint}` : `api/${endpoint}`;
    
    const response = await fetch(`/${apiEndpoint}`, {
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
  return fetchFromApi(`/upload/property/${propertyId}/images`);
};

/**
 * Get property documents
 */
export const getPropertyDocuments = async (propertyId: string) => {
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
export const addUserToProperty = async (propertyId: string, userData: { user_id?: string, email?: string, user_role: string }) => {
  return fetchFromApi(`/property-users?propertyId=${propertyId}`, {
    method: 'POST',
    body: JSON.stringify(userData)
  });
};

/**
 * Remove a user from a property
 */
export const removeUserFromProperty = async (propertyId: string, userId: string) => {
  return fetchFromApi(`/property-users/remove?propertyId=${propertyId}&userId=${userId}`, {
    method: 'DELETE'
  });
};

/**
 * Look up a user by email
 */
export const lookupUserByEmail = async (email: string) => {
  return fetchFromApi(`/users/lookup?email=${encodeURIComponent(email)}`);
};

/**
 * Create a new agreement
 */
export interface CheckItem {
  text: string;
  checked: boolean;
  assigned_to?: string | null;
  completed_by?: string | null;
  completed_at?: string | null;
}

export interface AgreementData {
  title: string;
  propertyId: string;
  checkItems: CheckItem[];
}

export const createAgreement = async (agreementData: AgreementData) => {
  return fetchFromApi('/agreements', {
    method: 'POST',
    body: JSON.stringify(agreementData)
  });
};

/**
 * Get all agreements
 */
export const getAgreements = async () => {
  return fetchFromApi('/agreements');
};

/**
 * Get agreements for a specific property
 */
export const getPropertyAgreements = async (propertyId: string) => {
  return fetchFromApi(`/agreements?propertyId=${propertyId}`);
};

/**
 * Get a specific agreement
 */
export const getAgreement = async (agreementId: string) => {
  return fetchFromApi(`/agreements/${agreementId}`);
};

/**
 * Update an agreement
 */
export const updateAgreement = async (agreementId: string, agreementData: Partial<AgreementData>) => {
  return fetchFromApi(`/agreements/${agreementId}`, {
    method: 'PUT',
    body: JSON.stringify(agreementData)
  });
};

// Add a new function to update task assignments
export async function updateAgreementTask(
  agreementId: string,
  taskIndex: number,
  action: 'assign' | 'unassign' | 'complete',
  userId?: string | null
): Promise<any> {
  try {
    return fetchFromApi(`/agreements/${agreementId}/tasks`, {
      method: 'PUT',
      body: JSON.stringify({
        taskIndex,
        action,
        userId
      })
    });
  } catch (error: any) {
    console.error('API error updating task:', error);
    throw error;
  }
}

/**
 * Accept property invitation
 */
export const acceptInvitation = async (token: string) => {
  return fetchFromApi(`/invitations/accept`, {
    method: 'POST',
    body: JSON.stringify({ token })
  });
};

/**
 * Send a deposit request email to the landlord
 */
export const sendDepositRequest = async (propertyId: string, requestData: { message: string, imageIds?: string[] }) => {
  return fetchFromApi(`deposit-requests?propertyId=${propertyId}`, {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
};

/**
 * Get deposit request history for a property
 */
export const getDepositRequests = async (propertyId: string) => {
  return fetchFromApi(`/deposit-requests?propertyId=${propertyId}`);
};

/**
 * Send a repair request email to the landlord
 */
export const sendRepairRequest = async (propertyId: string, requestData: { message: string, imageIds?: string[] }) => {
  return fetchFromApi(`repair-requests?propertyId=${propertyId}`, {
    method: 'POST',
    body: JSON.stringify(requestData)
  });
};

/**
 * Get repair request history for a property
 */
export const getRepairRequests = async (propertyId: string) => {
  return fetchFromApi(`/repair-requests?propertyId=${propertyId}`);
}; 