import React, { useState } from 'react';
import { Checkbox, Input } from '@/components/ui/FormElements';
import { CheckItem, PropertyUsers } from '@/types/agreement';
import { User, Bell, ChevronsUpDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface ChecklistItemProps {
  item: CheckItem;
  propertyUsers: PropertyUsers[];
  onTextChange: (id: string, text: string) => void;
  onCheckedChange: (id: string, checked: boolean) => void;
  onAssignChange: (id: string, userId: string | null) => void;
  onNotificationDaysChange: (id: string, days: number | null) => void;
  selectedProperty: string;
}

export const ChecklistItem = ({
  item,
  propertyUsers,
  onTextChange,
  onCheckedChange,
  onAssignChange,
  onNotificationDaysChange,
  selectedProperty
}: ChecklistItemProps) => {
  // Find the assigned user
  const assignedUser = item.assignedTo 
    ? propertyUsers.find(user => user.user_id === item.assignedTo)
    : null;

  // Get the display name for the assigned user
  const getAssignedUserDisplay = () => {
    if (!assignedUser) return 'Assign to...';
    return assignedUser.profile?.display_name || assignedUser.profile?.email || assignedUser.user_id;
  };
  
  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`check-${item.id}`}
          checked={item.checked}
          onCheckedChange={(checked: boolean) => 
            onCheckedChange(item.id, checked)
          }
        />
        <Input
          placeholder="Enter check item"
          value={item.text}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onTextChange(item.id, e.target.value)}
          className="flex-1"
        />
      </div>
      
      {selectedProperty && (
        <div className="flex flex-col sm:flex-row gap-3 ml-6">
          <div className="w-full sm:w-1/2">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 text-gray-600 focus:ring-blue-500 focus:border-blue-500">
                <div className="flex items-center gap-2 truncate">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="truncate">{getAssignedUserDisplay()}</span>
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 text-gray-500 flex-shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full" align="start">
                <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAssignChange(item.id, null)}>
                  <span>Unassigned</span>
                  {!item.assignedTo && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                </DropdownMenuItem>
                {propertyUsers.map((user) => (
                  <DropdownMenuItem 
                    key={user.user_id}
                    onClick={() => onAssignChange(item.id, user.user_id)}
                  >
                    <span>{user.profile?.display_name || user.profile?.email || user.user_id}</span>
                    {user.user_id === item.assignedTo && <Check className="ml-auto h-4 w-4 text-blue-600" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Bell className="h-4 w-4" />
              <span className="text-sm whitespace-nowrap">Notify</span>
            </div>
            <Input 
              type="number"
              min="0"
              max="365"
              placeholder="0"
              value={item.notificationDaysBefore !== null ? item.notificationDaysBefore : ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value === '' ? null : parseInt(e.target.value, 10);
                onNotificationDaysChange(item.id, value);
              }}
              className="w-20"
            />
            <span className="text-sm text-gray-500">days before</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChecklistItem; 