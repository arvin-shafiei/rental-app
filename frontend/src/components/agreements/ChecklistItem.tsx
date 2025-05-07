import React from 'react';
import { Checkbox, Input, Select, SelectItem } from '@/components/ui/FormElements';
import { CheckItem, PropertyUsers } from '@/types/agreement';

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
  return (
    <div className="space-y-2">
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
        <div className="flex gap-2 ml-6">
          <Select
            value={item.assignedTo || ""}
            onValueChange={(value: string) => onAssignChange(item.id, value || null)}
            placeholder="Assign to..."
            className="flex-1"
          >
            <SelectItem value="">Unassigned</SelectItem>
            {propertyUsers.map((user) => (
              <SelectItem key={user.user_id} value={user.user_id}>
                {user.profile?.display_name || user.profile?.email || user.user_id}
              </SelectItem>
            ))}
          </Select>
          
          {item.assignedTo && (
            <div className="flex items-center gap-2">
              <span className="text-sm whitespace-nowrap">Notify days before:</span>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChecklistItem; 