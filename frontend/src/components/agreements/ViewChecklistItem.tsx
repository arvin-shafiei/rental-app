import React, { useState } from 'react';
import { Checkbox, Select, SelectItem, Input } from '@/components/ui/FormElements';
import { PropertyUsers } from '@/types/agreement';

interface ViewChecklistItemProps {
  item: {
    text: string;
    checked: boolean;
    assigned_to?: string | null;
    completed_by?: string | null;
    completed_at?: string | null;
    notification_days_before?: number | null;
  };
  index: number;
  users: PropertyUsers[];
  isUpdating: boolean;
  isAssigning: boolean;
  canEdit: boolean;
  currentUserId: string | null;
  onUpdateCheckItem: (checked: boolean) => Promise<void>;
  onAssignUser: (userId: string | null, notificationDays?: number | null) => Promise<void>;
  getUserEmail: (userId: string | null) => string;
}

const ViewChecklistItem = ({
  item,
  index,
  users,
  isUpdating,
  isAssigning,
  canEdit,
  currentUserId,
  onUpdateCheckItem,
  onAssignUser,
  getUserEmail
}: ViewChecklistItemProps) => {
  // Check if the current user can assign/unassign
  const canAssign = canEdit || 
    (!canEdit && !item.assigned_to);
  
  const canUnassign = canEdit || 
    (!canEdit && item.assigned_to === currentUserId);
    
  // State for notification days
  const [notificationDays, setNotificationDays] = useState<number | null>(
    item.notification_days_before || null
  );
  
  // State for the selected user when assigning
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Handle assignment with notification days
  const handleAssign = () => {
    onAssignUser(selectedUserId || null, notificationDays);
    setSelectedUserId('');
  };
  
  // Handle self-assignment with notification days
  const handleSelfAssign = () => {
    onAssignUser(currentUserId, notificationDays);
  };

  return (
    <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md">
      <Checkbox
        id={`view-check-${index}`}
        checked={item.checked}
        onCheckedChange={(checked: boolean) => onUpdateCheckItem(checked)}
        disabled={isUpdating || isAssigning}
      />
      <div className="flex-1">
        <span className={`${item.checked ? 'line-through text-gray-500' : ''}`}>
          {item.text}
        </span>
        
        {/* Assignment info with assign/unassign options */}
        <div className="mt-1 flex items-center flex-wrap gap-2">
          {isAssigning ? (
            <span className="text-sm text-orange-500">Updating assignment...</span>
          ) : (
            <>
              {item.assigned_to && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-600">
                    Assigned to: {getUserEmail(item.assigned_to)}
                  </span>
                  {item.notification_days_before !== null && (
                    <span className="text-xs text-gray-500">
                      (Notification: {item.notification_days_before} days before)
                    </span>
                  )}
                </div>
              )}
              
              {/* Assignment controls */}
              {/* Owner can assign to anyone or unassign */}
              {canEdit && (
                <div className="ml-auto">
                  {!item.assigned_to ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedUserId}
                          onValueChange={(value: string) => setSelectedUserId(value)}
                          placeholder="Assign to..."
                        >
                          {users.map((user) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.profile?.email || user.profile?.display_name || user.user_id}
                            </SelectItem>
                          ))}
                        </Select>
                        <button 
                          onClick={handleAssign}
                          disabled={!selectedUserId}
                          className={`px-2 py-1 text-xs text-white rounded ${!selectedUserId ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
                        >
                          Assign
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs whitespace-nowrap">Notify days before:</span>
                        <Input 
                          type="number"
                          min="0"
                          max="365"
                          placeholder="0"
                          value={notificationDays !== null ? notificationDays : ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            setNotificationDays(value);
                          }}
                          className="w-20 h-8 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => onAssignUser(null, null)}
                      className="text-xs text-red-500 underline"
                    >
                      Unassign
                    </button>
                  )}
                </div>
              )}
              
              {/* Tenant can only self-assign or unassign self */}
              {!canEdit && (
                <div className="ml-auto">
                  {!item.assigned_to ? (
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={handleSelfAssign}
                        className="text-xs text-blue-500 underline"
                      >
                        Assign to me
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="text-xs whitespace-nowrap">Notify days before:</span>
                        <Input 
                          type="number"
                          min="0"
                          max="365"
                          placeholder="0"
                          value={notificationDays !== null ? notificationDays : ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                            setNotificationDays(value);
                          }}
                          className="w-20 h-8 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    item.assigned_to === currentUserId && (
                      <button 
                        onClick={() => onAssignUser(null, null)}
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
            Completed by: {getUserEmail(item.completed_by)} on {new Date(item.completed_at!).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewChecklistItem; 