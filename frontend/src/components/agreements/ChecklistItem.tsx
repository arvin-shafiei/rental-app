import React from 'react';
import { Checkbox, Input, Select, SelectItem } from '@/components/ui/FormElements';
import { CheckItem, PropertyUsers } from '@/types/agreement';

interface ChecklistItemProps {
  item: CheckItem;
  propertyUsers: PropertyUsers[];
  onTextChange: (id: string, text: string) => void;
  onCheckedChange: (id: string, checked: boolean) => void;
  onAssignChange: (id: string, userId: string | null) => void;
  selectedProperty: string;
}

export const ChecklistItem = ({
  item,
  propertyUsers,
  onTextChange,
  onCheckedChange,
  onAssignChange,
  selectedProperty
}: ChecklistItemProps) => {
  return (
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
      {selectedProperty && (
        <Select
          value={item.assignedTo || ""}
          onValueChange={(value: string) => onAssignChange(item.id, value || null)}
          placeholder="Assign to..."
        >
          <SelectItem value="">Unassigned</SelectItem>
          {propertyUsers.map((user) => (
            <SelectItem key={user.user_id} value={user.user_id}>
              {user.profile?.display_name || user.profile?.email || user.user_id}
            </SelectItem>
          ))}
        </Select>
      )}
    </div>
  );
};

export default ChecklistItem; 