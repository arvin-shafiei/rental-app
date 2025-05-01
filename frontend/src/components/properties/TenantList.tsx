import { UserPlus, Trash2 } from 'lucide-react';
import { User } from './PropertyTenants';

interface TenantListProps {
  users: User[];
  currentUserId: string;
  ownerId: string | null;
  onRemoveUser: (userId: string) => void;
}

export default function TenantList({ 
  users, 
  currentUserId, 
  ownerId, 
  onRemoveUser 
}: TenantListProps) {
  // Check if the current user is the owner
  const isCurrentUserOwner = Boolean(currentUserId) && Boolean(ownerId) && currentUserId === ownerId;
  
  return (
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
              
              {/* Only show remove button if current user is owner and not removing themselves */}
              {isCurrentUserOwner && 
               (user.user_role !== 'owner' || users.filter(u => u.user_role === 'owner').length > 1) && 
               user.user_id !== currentUserId && (
                <button
                  onClick={() => onRemoveUser(user.user_id)}
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
            {isCurrentUserOwner ? 'Add tenants to this property using the form above.' : 'No tenants have been added to this property yet.'}
          </p>
        </div>
      )}
    </div>
  );
} 