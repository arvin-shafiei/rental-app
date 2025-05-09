import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, UserPlus, Users, Mail, Phone, User, Shield } from 'lucide-react';
import { fetchFromApi } from '@/lib/api';
import TenantLookupForm from './TenantLookupForm';

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
    phone_number?: string;
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
  const [showAddTenant, setShowAddTenant] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    if (propertyId) {
      fetchPropertyUsers();
    }
  }, [propertyId]);

  // Fallback function to get property owner data if not present in users list
  const fetchPropertyOwner = async () => {
    try {
      const propertyData = await fetchFromApi(`/properties/${propertyId}`);
      const propertyInfo = propertyData?.data || propertyData;
      
      if (propertyInfo && propertyInfo.user_id) {
        setOwnerId(propertyInfo.user_id);
        
        const ownerProfile = await fetchFromApi(`/users/lookup?id=${propertyInfo.user_id}`);
        const profileData = ownerProfile?.data || ownerProfile;
        
        if (profileData) {
          const ownerUser: User = {
            id: `owner-${propertyId}`,
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
      
      const response = await fetchFromApi(`/property-users?propertyId=${propertyId}`);
      const result = response?.data || response;
      
      const usersList = Array.isArray(result) ? result : [];
      const containsCurrentUser = usersList.some((user: any) => user.user_id === currentUserId);
      
      let formattedUsers = usersList.map((user: any) => {
        if (user.user_role === 'owner') {
          setOwnerId(user.user_id);
        }
        return user;
      });
      
      if (formattedUsers.length === 0 || (currentUserId && !containsCurrentUser)) {
        const ownerUser = await fetchPropertyOwner();
        
        if (ownerUser) {
          if (!formattedUsers.some(user => user.user_id === ownerUser.user_id)) {
            formattedUsers = [...formattedUsers, ownerUser];
          }
        }
      }
      
      setUsers(formattedUsers);
    } catch (err: any) {
      console.error("Error fetching property users:", err);
      setError(err.message || 'Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Remove this person from the property?')) {
      return;
    }
    
    try {
      await fetchFromApi(`/property-users/${propertyId}/${userId}`, {
        method: 'DELETE',
      });
      
      fetchPropertyUsers();
    } catch (err: any) {
      console.error("Error removing user:", err);
      setError(err.message || 'Failed to remove user');
    }
  };

  // Check if the current user is the owner
  const isCurrentUserOwner = Boolean(currentUserId) && Boolean(ownerId) && currentUserId === ownerId;

  if (loading) {
    return (
      <div className="flex items-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-medium text-gray-900">People</h2>
        
        {isCurrentUserOwner && !showAddTenant && (
          <button
            onClick={() => setShowAddTenant(true)}
            className="text-sm px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        )}
        
        {isCurrentUserOwner && showAddTenant && (
          <button
            onClick={() => setShowAddTenant(false)}
            className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
        
      {error && (
        <div className="bg-red-50 text-red-700 p-2 mb-3 rounded-md text-sm">
          <AlertCircle className="h-4 w-4 inline mr-1" />
          {error}
        </div>
      )}
      
      {/* Add New Person Section */}
      {showAddTenant && isCurrentUserOwner && (
        <div className="mb-4">
          <TenantLookupForm 
            onUserAdded={() => {
              fetchPropertyUsers();
              setShowAddTenant(false);
            }} 
            propertyId={propertyId} 
          />
        </div>
      )}
      
      {/* People List */}
      {users.length > 0 ? (
        <div className="space-y-2">
          {users.map(user => (
            <div 
              key={user.id} 
              className="flex bg-white p-3 rounded-md border border-gray-200 items-center"
            >
              <div className="w-8 h-8 rounded-full mr-3 flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
                {user.profile?.avatar_url ? (
                  <img 
                    src={user.profile.avatar_url} 
                    alt={user.profile?.display_name || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-gray-500" />
                )}
              </div>
              
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {user.profile?.display_name || 'Unnamed User'}
                  </h3>
                  {user.user_role === 'owner' && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5 rounded-sm">
                      Owner
                    </span>
                  )}
                </div>
                
                {user.profile?.email && (
                  <div className="text-xs text-gray-500 truncate">
                    {user.profile.email}
                  </div>
                )}
              </div>
              
              {isCurrentUserOwner && user.user_role !== 'owner' && (
                <button
                  onClick={() => handleRemoveUser(user.user_id)}
                  className="text-red-500 hover:text-red-700 p-1 ml-1"
                  title="Remove"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-sm text-gray-500">No people associated with this property yet.</p>
          {isCurrentUserOwner && !showAddTenant && (
            <button 
              onClick={() => setShowAddTenant(true)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Add someone
            </button>
          )}
        </div>
      )}
    </div>
  );
} 