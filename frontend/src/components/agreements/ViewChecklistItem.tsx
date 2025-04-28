import React from 'react';
import { Checkbox, Select, SelectItem } from '@/components/ui/FormElements';
import { PropertyUsers } from '@/types/agreement';

interface ViewChecklistItemProps {
  item: {
    text: string;
    checked: boolean;
    assigned_to?: string | null;
    completed_by?: string | null;
    completed_at?: string | null;
  };
  index: number;
  userRole: string | null;
  viewPropertyUsers: PropertyUsers[];
  updatingItem: string | null;
  assigningItem: string | null;
  onUpdateCheckItem: (index: number, checked: boolean) => Promise<void>;
  onAssignUser: (index: number, userId: string | null) => Promise<void>;
  getUserEmailById: (userId: string | null) => string;
}

const ViewChecklistItem = ({
  item,
  index,
  userRole,
  viewPropertyUsers,
  updatingItem,
  assigningItem,
  onUpdateCheckItem,
  onAssignUser,
  getUserEmailById
}: ViewChecklistItemProps) => {
  return (
    <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md">
      <Checkbox
        id={`view-check-${index}`}
        checked={item.checked}
        onCheckedChange={(checked: boolean) => onUpdateCheckItem(index, checked)}
        disabled={updatingItem === index.toString() || assigningItem === index.toString()}
      />
      <div className="flex-1">
        <span className={`${item.checked ? 'line-through text-gray-500' : ''}`}>
          {item.text}
        </span>
        
        {/* Assignment info with assign/unassign options */}
        <div className="mt-1 flex items-center flex-wrap gap-2">
          {assigningItem === index.toString() ? (
            <span className="text-sm text-orange-500">Updating assignment...</span>
          ) : (
            <>
              {item.assigned_to && (
                <span className="text-sm text-blue-600">
                  Assigned to: {getUserEmailById(item.assigned_to)}
                </span>
              )}
              
              {/* Assignment controls */}
              {/* Owner can assign to anyone or unassign */}
              {userRole === 'owner' && (
                <div className="ml-auto">
                  {!item.assigned_to ? (
                    <Select
                      value=""
                      onValueChange={(value: string) => onAssignUser(index, value || null)}
                      placeholder="Assign to..."
                    >
                      {viewPropertyUsers.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.profile?.email || user.profile?.display_name || user.user_id}
                        </SelectItem>
                      ))}
                    </Select>
                  ) : (
                    <button 
                      onClick={() => onAssignUser(index, null)}
                      className="text-xs text-red-500 underline"
                    >
                      Unassign
                    </button>
                  )}
                </div>
              )}
              
              {/* Tenant can only self-assign or unassign self */}
              {userRole === 'tenant' && (
                <div className="ml-auto">
                  {!item.assigned_to ? (
                    <button 
                      onClick={() => {
                        // Find current user's ID
                        const currentUser = viewPropertyUsers.find(u => u.user_role === 'tenant');
                        if (currentUser) {
                          onAssignUser(index, currentUser.user_id);
                        }
                      }}
                      className="text-xs text-blue-500 underline"
                    >
                      Assign to me
                    </button>
                  ) : (
                    // Only show unassign if assigned to current user
                    item.assigned_to === viewPropertyUsers.find(u => u.user_role === 'tenant')?.user_id && (
                      <button 
                        onClick={() => onAssignUser(index, null)}
                        className="text-xs text-red-500 underline"
                      >
                        Unassign
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
        
        {item.completed_by && (
          <div className="text-xs text-gray-500 mt-1">
            Completed by: {getUserEmailById(item.completed_by)} on {new Date(item.completed_at!).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewChecklistItem; 