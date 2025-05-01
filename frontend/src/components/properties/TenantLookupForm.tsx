import { useState } from 'react';
import { Search, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { fetchFromApi } from '@/lib/api';

interface TenantLookupFormProps {
  onUserAdded: () => void;
  propertyId: string;
}

export default function TenantLookupForm({ onUserAdded, propertyId }: TenantLookupFormProps) {
  const [email, setEmail] = useState('');
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<any | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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
      
      // Clear search and notify parent
      setEmail('');
      setFoundUser(null);
      onUserAdded();
    } catch (err: any) {
      console.error("Error adding user:", err);
      setSearchError(err.message || 'Failed to add tenant');
    } finally {
      setAddingUser(false);
    }
  };

  return (
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
  );
} 