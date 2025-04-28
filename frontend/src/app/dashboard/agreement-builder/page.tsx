'use client';

import { useState, useEffect } from 'react';
import TabButton from '@/components/ui/TabButton';
import { getProperties, getPropertyUsers, createAgreement, AgreementData, CheckItem as ApiCheckItem } from '@/lib/api';

// Temporary UI component placeholders since the real components are not available
const Button = ({ children, className, onClick, variant, size, disabled }: any) => (
  <button 
    className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} 
    onClick={onClick} 
    disabled={disabled}
  >
    {children}
  </button>
);

const Card = ({ children }: any) => <div className="border rounded-md p-6">{children}</div>;
const CardHeader = ({ children }: any) => <div className="mb-4">{children}</div>;
const CardTitle = ({ children }: any) => <h2 className="text-xl font-bold text-black">{children}</h2>;
const CardDescription = ({ children }: any) => <p className="text-gray-700 text-sm">{children}</p>;
const CardContent = ({ children, className }: any) => <div className={className}>{children}</div>;

const Input = ({ id, placeholder, value, onChange, className }: any) => (
  <input 
    id={id} 
    placeholder={placeholder} 
    value={value} 
    onChange={onChange} 
    className={`border rounded-md p-2 w-full text-black ${className || ''}`} 
  />
);

const Label = ({ htmlFor, children }: any) => (
  <label htmlFor={htmlFor} className="font-medium mb-1 block text-black">{children}</label>
);

const Checkbox = ({ id, checked, onCheckedChange }: any) => (
  <input 
    type="checkbox" 
    id={id} 
    checked={checked} 
    onChange={(e) => onCheckedChange(e.target.checked)} 
  />
);

// Fixed Select component that correctly uses option elements
const Select = ({ children, onValueChange, value, placeholder }: any) => (
  <div className="relative">
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)} 
      className="border rounded-md p-2 w-full appearance-none text-black"
      aria-label={placeholder}
    >
      <option value="" disabled className="text-gray-500">{placeholder || 'Select an option'}</option>
      {children}
    </select>
    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
);

// We no longer need these components as we're now using a native select properly
// Instead of having divs inside the select, we'll directly render option elements
const SelectItem = ({ value, children }: any) => (
  <option value={value} className="text-black">{children}</option>
);

const toast = ({ title, description, variant }: any) => {
  console.log(`${title}: ${description}`);
  alert(`${title}: ${description}`);
};

interface Property {
  id: string;
  address: string;
  name?: string;
}

interface PropertyUser {
  id: string;
  user_id: string;
  property_id: string;
  user_role: string;
  email?: string;
  name?: string;
}

interface CheckItem {
  id: string;
  text: string;
  checked: boolean;
  assignedTo?: string | null;
}

export default function AgreementBuilder() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [propertyUsers, setPropertyUsers] = useState<PropertyUser[]>([]);
  const [agreementTitle, setAgreementTitle] = useState<string>('');
  const [checkItems, setCheckItems] = useState<CheckItem[]>([
    { id: '1', text: '', checked: false, assignedTo: null }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        const response = await getProperties();
        console.log('Properties response:', response);
        // Extract properties from the data property of the response
        const propertiesArray = response.data && Array.isArray(response.data) ? response.data : [];
        setProperties(propertiesArray);
      } catch (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: 'Error',
          description: 'Failed to load properties',
          variant: 'destructive',
        });
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, []);

  useEffect(() => {
    const fetchPropertyUsers = async () => {
      if (!selectedProperty) return;
      
      try {
        setLoading(true);
        const data = await getPropertyUsers(selectedProperty);
        // Filter to only include tenants
        const tenants = Array.isArray(data) 
          ? data.filter((user: PropertyUser) => user.user_role === 'tenant')
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
    <div className="container mx-auto py-6 text-black">
      <h1 className="text-3xl font-bold mb-6 text-black">Agreement Builder</h1>
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
                        {user.name || user.email || user.user_id}
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
                <div key={item.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`check-${item.id}`}
                    checked={item.checked}
                    onCheckedChange={(checked: boolean) => 
                      handleCheckboxChange(item.id, checked)
                    }
                  />
                  <Input
                    placeholder="Enter check item"
                    value={item.text}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCheckItemChange(item.id, e.target.value)}
                    className="flex-1"
                  />
                  {selectedProperty && (
                    <Select
                      value={item.assignedTo || ""}
                      onValueChange={(value: string) => 
                        setCheckItems(
                          checkItems.map(ci => 
                            ci.id === item.id ? { ...ci, assignedTo: value || null } : ci
                          )
                        )
                      }
                      placeholder="Assign to..."
                    >
                      <SelectItem value="">Unassigned</SelectItem>
                      {propertyUsers.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.name || user.email || user.user_id}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </div>
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
    </div>
  );
}
