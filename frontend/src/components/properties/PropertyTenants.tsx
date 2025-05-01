import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { fetchFromApi } from '@/lib/api';
import TenantLookupForm from './TenantLookupForm';
import TenantList from './TenantList';

export interface User {
  id: string;
  property_id: string;
  user_id: string;
  user_role: 'owner' | 'tenant';
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface PropertyTenantsProps {
  propertyId: string;
  currentUserId: string;
}

export default function PropertyTenants({ propertyId, currentUserId }: PropertyTenantsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  // Debug logs
  useEffect(() => {
    console.log('PropertyTenants component mounted');
    console.log('Current user ID:', currentUserId);
    console.log('Property ID:', propertyId);
  }, []);

  // Fetch users on component mount
  useEffect(() => {
    if (propertyId) {
      fetchPropertyUsers();
    }
  }, [propertyId]);

  // Debug logs for IDs
  useEffect(() => {
    console.log("Current User ID:", currentUserId);
    console.log("Property Owner ID:", ownerId);
    console.log("Is current user the owner?", currentUserId === ownerId);
  }, [currentUserId, ownerId]);

  // Fallback function to get property owner data if not present in users list
  const fetchPropertyOwner = async () => {
    try {
      // Get the property details to find the owner
      const propertyData = await fetchFromApi(`/properties/${propertyId}`);
      
      // Check if propertyData has the correct structure and contains owner information
      const propertyInfo = propertyData?.data || propertyData;
      
      if (propertyInfo && propertyInfo.user_id) {
        console.log("Found property owner ID:", propertyInfo.user_id);
        
        // Set the owner ID in state
        setOwnerId(propertyInfo.user_id);
        
        // Get the owner's profile information
        const ownerProfile = await fetchFromApi(`/users/lookup?id=${propertyInfo.user_id}`);
        const profileData = ownerProfile?.data || ownerProfile;
        
        if (profileData) {
          // Create a user object in the format expected by the component
          const ownerUser: User = {
            id: `owner-${propertyId}`, // Generate a unique ID for this entry
            property_id: propertyId,
            user_id: propertyInfo.user_id,
            user_role: 'owner',
            created_at: propertyInfo.created_at,
            updated_at: propertyInfo.updated_at,
            profile: {
              display_name: profileData.display_name || 'Property Owner',
              email: profileData.email,
              avatar_url: profileData.avatar_url
            }
          };
          
          return ownerUser;
        }
      }
      return null;
    } catch (err) {
      console.error("Error fetching property owner:", err);
      return null;
    }
  };

  const fetchPropertyUsers = async () => {
    try {
      setLoading(true);
      
      // Use the fetchFromApi helper which handles auth correctly
      const response = await fetchFromApi(`/property-users?propertyId=${propertyId}`);
      
      // Check if response has a data property (API response structure)
      const result = response?.data || response;
      
      console.log("Property users fetched:", result);
      console.log("Current user ID:", currentUserId);
      
      // Safely check if result is an array before using .some()
      const usersList = Array.isArray(result) ? result : [];
      const containsCurrentUser = usersList.some((user: any) => user.user_id === currentUserId);
      console.log("Users list contains current user:", containsCurrentUser);
      
      // Map through users to ensure complete data
      let formattedUsers = usersList.map((user: any) => {
        console.log(`User: ${user.user_id}, Role: ${user.user_role}, Email: ${user.profile?.email}`);
        
        // If we found an owner, set the owner ID
        if (user.user_role === 'owner') {
          setOwnerId(user.user_id);
        }
        
        return user;
      });
      
      // If we have no users or the current user is not in the list (and they should be the owner),
      // try to fetch the property owner information as a fallback
      if (formattedUsers.length === 0 || 
         (currentUserId && !containsCurrentUser)) {
        console.log("No users found or current user missing - fetching property owner as fallback");
        const ownerUser = await fetchPropertyOwner();
        
        if (ownerUser) {
          console.log("Adding owner to users list:", ownerUser);
          // Add the owner to the users list if they're not already there
          if (!formattedUsers.some(user => user.user_id === ownerUser.user_id)) {
            formattedUsers = [...formattedUsers, ownerUser];
          }
        }
      }
      
      setUsers(formattedUsers);
    } catch (err: any) {
      console.error("Error fetching property users:", err);
      setError(err.message || 'Failed to load tenants');
    } finally {
      // Always set loading to false to prevent infinite loading state
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this tenant from the property?')) {
      return;
    }
    
    try {
      // Use the fetchFromApi helper which handles auth correctly
      await fetchFromApi(`/property-users/${propertyId}/${userId}`, {
        method: 'DELETE',
      });
      
      // Refresh the user list
      fetchPropertyUsers();
    } catch (err: any) {
      console.error("Error removing user:", err);
      setError(err.message || 'Failed to remove tenant');
    }
  };

  // Check if the current user is the owner
  const isCurrentUserOwner = Boolean(currentUserId) && Boolean(ownerId) && currentUserId === ownerId;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Property Tenants</h2>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}
        
        {/* Only show the Add New Tenant section if current user is the owner */}
        {isCurrentUserOwner && (
          <TenantLookupForm 
            onUserAdded={fetchPropertyUsers} 
            propertyId={propertyId} 
          />
        )}
        
        <TenantList 
          users={users}
          currentUserId={currentUserId}
          ownerId={ownerId}
          onRemoveUser={handleRemoveUser}
        />
      </div>
    </div>
  );
} 