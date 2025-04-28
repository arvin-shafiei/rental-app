import React, { useState, useEffect } from 'react';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, 
  Button, Label, Input, Select, SelectItem, toast 
} from '@/components/ui/FormElements';
import ChecklistItem from './ChecklistItem';
import { Property, PropertyUsers, CheckItem, AgreementData, ApiCheckItem } from '@/types/agreement';
import { getPropertyUsers, createAgreement, getPropertyAgreements } from '@/lib/api';

interface CreateAgreementFormProps {
  properties: Property[];
  isLoading: boolean;
  onAgreementCreated: (propertyId: string) => void;
}

const CreateAgreementForm = ({ 
  properties, 
  isLoading,
  onAgreementCreated 
}: CreateAgreementFormProps) => {
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [propertyUsers, setPropertyUsers] = useState<PropertyUsers[]>([]);
  const [agreementTitle, setAgreementTitle] = useState<string>('');
  const [checkItems, setCheckItems] = useState<CheckItem[]>([
    { id: '1', text: '', checked: false, assignedTo: null }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch property users when a property is selected
  useEffect(() => {
    const fetchPropertyUsers = async () => {
      if (!selectedProperty) return;
      
      try {
        setLoading(true);
        const data = await getPropertyUsers(selectedProperty);
        // Filter to only include tenants
        const tenants = Array.isArray(data) 
          ? data.filter((user: PropertyUsers) => user.user_role === 'tenant')
          : [];
        setPropertyUsers(tenants);
      } catch (error) {
        console.error('Error fetching property users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load property users',
          variant: 'destructive',
        });
        setPropertyUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyUsers();
  }, [selectedProperty]);

  const handleAddCheckItem = () => {
    setCheckItems([
      ...checkItems,
      { id: Date.now().toString(), text: '', checked: false, assignedTo: null }
    ]);
  };

  const handleCheckItemChange = (id: string, text: string) => {
    setCheckItems(
      checkItems.map(item => 
        item.id === id ? { ...item, text } : item
      )
    );
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setCheckItems(
      checkItems.map(item => 
        item.id === id ? { ...item, checked } : item
      )
    );
  };

  const handleAssignChange = (id: string, userId: string | null) => {
    setCheckItems(
      checkItems.map(item => 
        item.id === id ? { ...item, assignedTo: userId } : item
      )
    );
  };

  const handleSubmit = async () => {
    if (!selectedProperty || !agreementTitle) {
      toast({
        title: 'Validation Error',
        description: 'Please select a property and enter an agreement title',
        variant: 'destructive',
      });
      return;
    }

    // Remove empty check items
    const validCheckItems = checkItems.filter(item => item.text.trim() !== '');
    
    if (validCheckItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one check item',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);

      // Transform the check items to match the API format
      const apiCheckItems: ApiCheckItem[] = validCheckItems.map(item => ({
        text: item.text,
        checked: item.checked,
        assigned_to: item.assignedTo || null
      }));

      // Create the agreement data
      const agreementData: AgreementData = {
        title: agreementTitle,
        propertyId: selectedProperty,
        checkItems: apiCheckItems
      };

      // Send to the API
      await createAgreement(agreementData);

      toast({
        title: 'Success',
        description: 'Agreement created successfully!',
      });

      // Reset the form after successful submission
      setAgreementTitle('');
      setSelectedProperty('');
      setCheckItems([{ id: '1', text: '', checked: false, assignedTo: null }]);
      
      // Notify parent component
      onAgreementCreated(selectedProperty);
    } catch (error) {
      console.error('Error creating agreement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create agreement',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Agreement</CardTitle>
        <CardDescription>
          Create a new agreement to send to all tenants of a property
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="property">Select Property</Label>
          {isLoading ? (
            <p className="text-sm text-black">Loading properties...</p>
          ) : (
            <Select
              value={selectedProperty}
              onValueChange={(value: string) => setSelectedProperty(value)}
              placeholder="Select a property"
            >
              {Array.isArray(properties) && properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name || property.address}
                </SelectItem>
              ))}
            </Select>
          )}
        </div>

        {selectedProperty && (
          <div className="space-y-2">
            <Label>Tenants who will receive this agreement:</Label>
            <div className="border rounded-md p-2 bg-gray-50">
              {loading ? (
                <p className="text-sm text-black">Loading tenants...</p>
              ) : propertyUsers.length > 0 ? (
                <ul className="text-sm text-black">
                  {propertyUsers.map((user) => (
                    <li key={user.id}>
                      {user.profile?.display_name || user.profile?.email || user.user_id}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-black">No tenants found for this property</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Agreement Title</Label>
          <Input
            id="title"
            placeholder="Enter agreement title"
            value={agreementTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgreementTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Checklist Items</Label>
            <Button variant="outline" size="sm" onClick={handleAddCheckItem} className="bg-blue-100 text-blue-700 px-3 py-1 rounded">
              Add Item
            </Button>
          </div>
          <div className="space-y-3">
            {checkItems.map((item) => (
              <ChecklistItem
                key={item.id}
                item={item}
                propertyUsers={propertyUsers}
                onTextChange={handleCheckItemChange}
                onCheckedChange={handleCheckboxChange}
                onAssignChange={handleAssignChange}
                selectedProperty={selectedProperty}
              />
            ))}
          </div>
        </div>

        <Button 
          className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Creating Agreement...' : 'Create Agreement'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CreateAgreementForm; 