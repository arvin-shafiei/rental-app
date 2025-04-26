import { useState, useEffect } from 'react';
import { Loader2, UserPlus, Trash2, Search, UserCheck, AlertCircle } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { fetchFromApi } from '@/lib/api';

interface User {
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
  const [email, setEmail] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  // Fetch users on component mount
  useEffect(() => {
    fetchPropertyUsers();
  }, [propertyId]);

  // Fallback function to get property owner data if not present in users list
  const fetchPropertyOwner = async () => {
    try {
      // Get the property details to find the owner
      const propertyData = await fetchFromApi(`/properties/${propertyId}`);
      
      // Check if propertyData has the correct structure and contains owner information
      const propertyInfo = propertyData?.data || propertyData;
      
      if (propertyInfo && propertyInfo.user_id) {
        console.log("Found property owner ID:", propertyInfo.user_id);
        
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

  const handleLookupUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setSearchError('Email is required');
      return;
    }
    
    try {
      setSearchingUser(true);
      setSearchError(null);
      setFoundUser(null);
      
      // Use the fetchFromApi helper which handles auth correctly
      const data = await fetchFromApi(`/users/lookup?email=${encodeURIComponent(email)}`);
      console.log("Found user:", data);
      setFoundUser(data);
    } catch (err: any) {
      console.error("Error looking up user:", err);
      
      // Provide a more user-friendly error message for 404 responses
      if (err.message && err.message.includes('404')) {
        setSearchError(`No user found with email "${email}". Please check the email address and try again.`);
      } else {
        setSearchError(err.message || 'Failed to lookup user');
      }
    } finally {
      setSearchingUser(false);
    }
  };

  const handleAddUser = async (userId: string) => {
    try {
      setAddingUser(true);
      
      // Use the fetchFromApi helper which handles auth correctly
      await fetchFromApi(`/property-users?propertyId=${propertyId}`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          user_role: 'tenant'
        }),
      });
      
      // Clear search and refresh user list
      setEmail('');
      setFoundUser(null);
      fetchPropertyUsers();
    } catch (err: any) {
      console.error("Error adding user:", err);
      setError(err.message || 'Failed to add tenant');
    } finally {
      setAddingUser(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
        
        <div className="bg-white rounded-md shadow-sm p-4 border mb-6">
          <h3 className="text-lg font-medium mb-3 text-gray-800">Add New Tenant</h3>
          <p className="text-sm text-gray-500 mb-4">
            Invite a user by entering their email address. The user must already have an account in the system.
          </p>
          
          <form onSubmit={handleLookupUser} className="flex flex-col space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                User Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="block w-full rounded-md border-gray-300 border py-2 px-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              {searchError && (
                <div className="mt-2 text-sm text-red-600">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    <div>
                      <p>{searchError}</p>
                      {searchError.includes("No user found") && (
                        <ul className="list-disc pl-5 mt-1 text-xs text-gray-600">
                          <li>Make sure the user has already created an account</li>
                          <li>Check for typos in the email address</li>
                          <li>The email must match exactly what was used during registration</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={searchingUser}
              className="inline-flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {searchingUser ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Searching...
                </>
              ) : (
                'Lookup User'
              )}
            </button>
          </form>
          
          {foundUser && (
            <div className="mt-4 p-3 border rounded-md bg-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {foundUser.avatar_url ? (
                      <img
                        src={foundUser.avatar_url}
                        alt={foundUser.display_name || foundUser.email}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">
                        {(foundUser.display_name || foundUser.email || 'User').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{foundUser.display_name || 'User'}</p>
                    <p className="text-sm text-gray-500">{foundUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleAddUser(foundUser.id)}
                  disabled={addingUser}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {addingUser ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add as Tenant
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-md shadow-sm">
          <div className="px-4 py-5 sm:px-6 border-b">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Current Tenants & Owners</h3>
            <p className="mt-1 text-sm text-gray-500">
              {users.length === 0 
                ? 'No users are associated with this property yet.'
                : 'Users with access to this property.'}
            </p>
          </div>
          
          {users.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {user.profile?.avatar_url ? (
                        <img
                          src={user.profile.avatar_url}
                          alt={user.profile?.display_name || ''}
                          className="h-10 w-10 rounded-full"
                        />
                      ) : (
                        <span className="text-gray-500 text-sm">
                          {(user.profile?.display_name || 'User').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {user.profile?.display_name || 'User'}
                        {user.user_id === currentUserId && <span className="ml-2 text-xs text-gray-500">(You)</span>}
                      </p>
                      <div className="flex items-center">
                        <p className="text-sm text-gray-500 mr-2">{user.profile?.email}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.user_role === 'owner' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.user_role.charAt(0).toUpperCase() + user.user_role.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Only show remove button for non-owners or if there are multiple owners */}
                  {(user.user_role !== 'owner' || users.filter(u => u.user_role === 'owner').length > 1) && 
                   user.user_id !== currentUserId && (
                    <button
                      onClick={() => handleRemoveUser(user.user_id)}
                      className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      title="Remove user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6 px-4">
              <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add tenants to this property using the form above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 