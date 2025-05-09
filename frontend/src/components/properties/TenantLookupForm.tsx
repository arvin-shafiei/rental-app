import { useState } from 'react';
import { Search, Loader2, AlertCircle, UserPlus } from 'lucide-react';
import { lookupUserByEmail, addUserToProperty } from '@/lib/api';
import { toast } from '@/components/ui/FormElements';

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
  const [inviteMode, setInviteMode] = useState(false);

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
      
      // Use the API helper function
      const data = await lookupUserByEmail(email);
      setFoundUser(data);
      setInviteMode(false);
    } catch (err: any) {
      console.error("Error looking up user:", err);
      
      // Provide a more user-friendly error message for 404 responses
      if (err.message && err.message.includes('404')) {
        setSearchError(`No user found with email "${email}"`);
        setInviteMode(true);
      } else {
        setSearchError(err.message || 'Failed to lookup user');
      }
    } finally {
      setSearchingUser(false);
    }
  };

  const handleAddUser = async (userId: string, userEmail: string) => {
    try {
      setAddingUser(true);
      
      await addUserToProperty(propertyId, {
        email: userEmail,
        user_role: 'tenant'
      });
      
      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${userEmail}`,
      });
      
      // Clear search and notify parent
      setEmail('');
      setFoundUser(null);
      onUserAdded();
    } catch (err: any) {
      console.error("Error sending invitation:", err);
      setSearchError(err.message || 'Failed to send invitation');
    } finally {
      setAddingUser(false);
    }
  };
  
  const handleSendInvitation = async () => {
    if (!email.trim()) {
      setSearchError('Email is required');
      return;
    }
    
    try {
      setAddingUser(true);
      
      // Use the API helper function
      await addUserToProperty(propertyId, {
        email: email,
        user_role: 'tenant'
      });
      
      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${email}`,
      });
      
      // Clear search and notify parent
      setEmail('');
      setFoundUser(null);
      setInviteMode(false);
      onUserAdded();
    } catch (err: any) {
      console.error("Error sending invitation:", err);
      setSearchError(err.message || 'Failed to send invitation');
    } finally {
      setAddingUser(false);
    }
  };

  return (
    <div className="border border-gray-200 bg-white p-4 rounded-md shadow-sm">
      <h3 className="text-base font-medium mb-2 text-gray-900">Invite your flatmates</h3>
      
      <form onSubmit={handleLookupUser} className="space-y-3">
        <div>
          <div className="relative">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="block w-full rounded-md border-gray-300 border py-2 px-3 text-black placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          {searchError && (
            <div className="mt-1 text-sm text-red-600">
              <p>{searchError}</p>
              {inviteMode && (
                <button 
                  type="button" 
                  onClick={handleSendInvitation}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm mt-1"
                >
                  Send invitation instead
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={searchingUser}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            {searchingUser ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />
                Searching...
              </>
            ) : (
              'Find'
            )}
          </button>
          
          {inviteMode && (
            <button
              type="button"
              onClick={handleSendInvitation}
              disabled={addingUser}
              className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              {addingUser ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />
                  Sending...
                </>
              ) : (
                'Invite'
              )}
            </button>
          )}
        </div>
      </form>
      
      {foundUser && (
        <div className="mt-3 p-2 rounded-md bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                {foundUser.avatar_url ? (
                  <img
                    src={foundUser.avatar_url}
                    alt={foundUser.display_name || foundUser.email}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-blue-700 font-medium text-xs">
                    {(foundUser.display_name || foundUser.email || 'User').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-900">{foundUser.display_name || 'User'}</p>
                <p className="text-xs text-gray-500">{foundUser.email}</p>
              </div>
            </div>
            <button
              onClick={() => handleAddUser(foundUser.id, foundUser.email)}
              disabled={addingUser}
              className="px-2.5 py-1 text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              {addingUser ? 'Sending...' : 'Invite'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 