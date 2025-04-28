'use client';

import { useState, useEffect } from 'react';
import TabButton from '@/components/ui/TabButton';
import { getProperties, getPropertyUsers, createAgreement, getPropertyAgreements, updateAgreement, updateAgreementTask, AgreementData, CheckItem as ApiCheckItem } from '@/lib/api';

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

const Checkbox = ({ id, checked, onCheckedChange, disabled }: any) => (
  <input 
    type="checkbox" 
    id={id} 
    checked={checked} 
    onChange={(e) => onCheckedChange(e.target.checked)} 
    disabled={disabled}
  />
);

// Fixed Select component that correctly uses option elements
const Select = ({ children, onValueChange, value, placeholder }: any) => (
  <div className="relative">
    <select 
      value={value || ""} 
      onChange={(e) => onValueChange && onValueChange(e.target.value)} 
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
  completed_by?: string | null;
  completed_at?: string | null;
}

interface Agreement {
  id: string;
  title: string;
  property_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  check_items: Array<{
    text: string;
    checked: boolean;
    assigned_to?: string | null;
    completed_by?: string | null;
    completed_at?: string | null;
  }>;
  property?: {
    id: string;
    name: string;
    address: string;
  };
}

export default function AgreementBuilder() {
  // Tab state
  const [activeTab, setActiveTab] = useState<'create' | 'view'>('create');
  
  // Create new agreement state
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
  
  // View agreements state
  const [viewSelectedProperty, setViewSelectedProperty] = useState<string>('');
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loadingAgreements, setLoadingAgreements] = useState<boolean>(false);
  const [selectedAgreement, setSelectedAgreement] = useState<string>('');
  const [selectedAgreementDetails, setSelectedAgreementDetails] = useState<Agreement | null>(null);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [viewPropertyUsers, setViewPropertyUsers] = useState<PropertyUser[]>([]);
  const [assigningItem, setAssigningItem] = useState<string | null>(null);

  // Fetch properties on initial load
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

  // Fetch property users when a property is selected
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
  
  // Fetch agreements when viewing tab and a property is selected
  useEffect(() => {
    const fetchAgreements = async () => {
      if (!viewSelectedProperty || activeTab !== 'view') return;
      
      try {
        setLoadingAgreements(true);
        const agreementsData = await getPropertyAgreements(viewSelectedProperty);
        
        if (Array.isArray(agreementsData)) {
          setAgreements(agreementsData);
          console.log('Agreements loaded:', agreementsData);
        } else {
          setAgreements([]);
          console.error('Unexpected format for agreements response:', agreementsData);
        }
      } catch (error) {
        console.error('Error fetching agreements:', error);
        toast({
          title: 'Error',
          description: 'Failed to load agreements',
          variant: 'destructive',
        });
        setAgreements([]);
      } finally {
        setLoadingAgreements(false);
      }
    };

    fetchAgreements();
  }, [viewSelectedProperty, activeTab]);
  
  // Update selected agreement details when an agreement is selected
  useEffect(() => {
    if (selectedAgreement) {
      const agreement = agreements.find(a => a.id === selectedAgreement);
      setSelectedAgreementDetails(agreement || null);
    } else {
      setSelectedAgreementDetails(null);
    }
  }, [selectedAgreement, agreements]);

  // Load property users and determine current user role when viewing an agreement
  useEffect(() => {
    const fetchViewPropertyUsers = async () => {
      if (!viewSelectedProperty || activeTab !== 'view') return;
      
      try {
        const data = await getPropertyUsers(viewSelectedProperty);
        
        if (Array.isArray(data)) {
          setViewPropertyUsers(data);
          
          if (selectedAgreementDetails) {
            // Find current user's role
            const currentUser = data.find(u => 
              // We don't have the actual user ID here, so we're assuming the
              // current user is the agreement creator for owners. This is a simplification.
              // In a real app, you'd check against the authenticated user's ID.
              selectedAgreementDetails.created_by === u.user_id
            );
            
            setUserRole(currentUser?.user_role || null);
          }
        }
      } catch (error) {
        console.error('Error fetching property users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load property users',
          variant: 'destructive',
        });
      }
    };
    
    fetchViewPropertyUsers();
  }, [viewSelectedProperty, selectedAgreementDetails, activeTab]);
  
  // Function to handle assigning a user to a task
  const handleAssignUser = async (itemIndex: number, userId: string | null) => {
    if (!selectedAgreementDetails) return;
    
    try {
      setAssigningItem(itemIndex.toString());
      
      // Get current user ID (simplified for example)
      const currentUser = viewPropertyUsers.find(u => u.user_role === userRole);
      const currentUserId = currentUser?.user_id;
      
      // Create a copy of the agreement's check items for local state update
      const updatedItems = [...selectedAgreementDetails.check_items];
      const currentItem = updatedItems[itemIndex];
      
      // Check permissions (client-side validation)
      if (userRole !== 'owner') {
        // For tenants, ensure they can only unassign themselves
        if (currentItem.assigned_to && currentItem.assigned_to !== currentUserId && userId === null) {
          toast({
            title: 'Permission Error',
            description: 'You can only unassign tasks assigned to you',
            variant: 'destructive',
          });
          setAssigningItem(null);
          return;
        }
        
        // For tenants assigning, they can only assign to themselves
        if (userId && userId !== currentUserId) {
          toast({
            title: 'Permission Error',
            description: 'You can only assign tasks to yourself',
            variant: 'destructive',
          });
          setAssigningItem(null);
          return;
        }
      }
      
      try {
        // Use task-specific API endpoint that handles proper permissions
        const action = userId === null ? 'unassign' : 'assign';
        const result = await updateAgreementTask(
          selectedAgreementDetails.id,
          itemIndex,
          action,
          userId
        );
        
        // If successful, update local state
        if (result) {
          // Update the item in our local state
          updatedItems[itemIndex] = {
            ...currentItem,
            assigned_to: userId
          };
          
          // Update selected agreement details
          setSelectedAgreementDetails({
            ...selectedAgreementDetails,
            check_items: updatedItems
          });
          
          // Update the agreement in the agreements list
          setAgreements(agreements.map(agreement => 
            agreement.id === selectedAgreementDetails.id 
              ? {...agreement, check_items: updatedItems} 
              : agreement
          ));
          
          toast({
            title: 'Success',
            description: userId ? 'Task assigned successfully' : 'Task unassigned successfully',
          });
        }
      } catch (error: any) {
        console.error('Error assigning task:', error);
        const errorMessage = error.message || 'Failed to update task assignment';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error assigning task:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign task',
        variant: 'destructive',
      });
    } finally {
      setAssigningItem(null);
    }
  };
  
  // Find user email by ID
  const getUserEmailById = (userId: string | null): string => {
    if (!userId) return 'Unassigned';
    
    const user = viewPropertyUsers.find(u => u.user_id === userId);
    return user?.email || user?.name || userId;
  };

  // Create new agreement functions
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
  
  // View/update existing agreement functions
  const handleUpdateCheckItem = async (itemIndex: number, checked: boolean) => {
    if (!selectedAgreementDetails) return;
    
    try {
      setUpdatingItem(itemIndex.toString());
      
      // Get current user info
      const currentUser = viewPropertyUsers.find(u => u.user_role === userRole);
      const currentUserId = currentUser?.user_id;
      
      // Create a copy of the agreement's check items
      const updatedItems = [...selectedAgreementDetails.check_items];
      const currentItem = updatedItems[itemIndex];
      
      // Check if the item is assigned to the current user or not assigned to anyone
      // Owners can update any item
      if (userRole !== 'owner' && 
          currentItem.assigned_to !== null && 
          currentItem.assigned_to !== currentUserId) {
        toast({
          title: 'Permission Error',
          description: 'You can only update tasks assigned to you',
          variant: 'destructive',
        });
        setUpdatingItem(null);
        return;
      }
      
      try {
        // Use the task-specific endpoint
        const action = 'complete'; // This is for checking/unchecking
        const result = await updateAgreementTask(
          selectedAgreementDetails.id,
          itemIndex,
          action,
          null // No userId needed for completing
        );
        
        if (result) {
          // The backend now toggles the checked state, so we need to get the updated value
          const updatedTask = result.check_items[itemIndex];
          
          // Update local state with the result from the backend
          setSelectedAgreementDetails({
            ...selectedAgreementDetails,
            check_items: result.check_items
          });
          
          // Update the agreement in the agreements list
          setAgreements(agreements.map(agreement => 
            agreement.id === selectedAgreementDetails.id 
              ? {...agreement, check_items: result.check_items} 
              : agreement
          ));
          
          toast({
            title: 'Success',
            description: `Task ${updatedTask.checked ? 'completed' : 'reopened'}`,
          });
        }
      } catch (error: any) {
        console.error('Error updating task:', error);
        const errorMessage = error.message || 'Failed to update task';
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating agreement item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update agreement item',
        variant: 'destructive',
      });
    } finally {
      setUpdatingItem(null);
    }
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
      
      // If the view tab has the same property selected, refresh agreements list
      if (viewSelectedProperty === selectedProperty && activeTab === 'view') {
        const agreementsData = await getPropertyAgreements(viewSelectedProperty);
        if (Array.isArray(agreementsData)) {
          setAgreements(agreementsData);
        }
      }
      
      // Switch to view tab to see the newly created agreement
      setViewSelectedProperty(selectedProperty);
      setActiveTab('view');
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
      <h1 className="text-3xl font-bold mb-6 text-black">Agreements</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-6">
        <TabButton 
          active={activeTab === 'create'} 
          onClick={() => setActiveTab('create')}
        >
          Create Agreement
        </TabButton>
        <TabButton 
          active={activeTab === 'view'} 
          onClick={() => setActiveTab('view')}
        >
          View Agreements
        </TabButton>
      </div>
      
      {/* Create Agreement Tab */}
      {activeTab === 'create' && (
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
      )}
      
      {/* View Agreements Tab */}
      {activeTab === 'view' && (
        <Card>
          <CardHeader>
            <CardTitle>View Agreements</CardTitle>
            <CardDescription>
              View and manage existing agreements for your properties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="view-property">Select Property</Label>
              {isLoading ? (
                <p className="text-sm text-black">Loading properties...</p>
              ) : (
                <Select
                  value={viewSelectedProperty}
                  onValueChange={(value: string) => {
                    setViewSelectedProperty(value);
                    setSelectedAgreement('');
                  }}
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
            
            {viewSelectedProperty && (
              <div className="space-y-2">
                <Label htmlFor="agreements">Select Agreement</Label>
                {loadingAgreements ? (
                  <p className="text-sm text-black">Loading agreements...</p>
                ) : (
                  <Select
                    value={selectedAgreement}
                    onValueChange={(value: string) => setSelectedAgreement(value)}
                    placeholder="Select an agreement"
                  >
                    {agreements.length > 0 ? (
                      agreements.map((agreement) => (
                        <SelectItem key={agreement.id} value={agreement.id}>
                          {agreement.title}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>No agreements found</SelectItem>
                    )}
                  </Select>
                )}
              </div>
            )}
            
            {selectedAgreementDetails && (
              <div className="border rounded-md p-4 mt-4">
                <h3 className="text-lg font-semibold mb-2">{selectedAgreementDetails.title}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Created: {new Date(selectedAgreementDetails.created_at).toLocaleDateString()}
                </p>
                
                <h4 className="font-medium mb-2">Checklist Items:</h4>
                {selectedAgreementDetails.check_items && selectedAgreementDetails.check_items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedAgreementDetails.check_items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md">
                        <Checkbox
                          id={`view-check-${index}`}
                          checked={item.checked}
                          onCheckedChange={(checked: boolean) => handleUpdateCheckItem(index, checked)}
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
                                        onValueChange={(value: string) => handleAssignUser(index, value || null)}
                                        placeholder="Assign to..."
                                      >
                                        {viewPropertyUsers.map((user) => (
                                          <SelectItem key={user.user_id} value={user.user_id}>
                                            {user.email || user.name || user.user_id}
                                          </SelectItem>
                                        ))}
                                      </Select>
                                    ) : (
                                      <button 
                                        onClick={() => handleAssignUser(index, null)}
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
                                            handleAssignUser(index, currentUser.user_id);
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
                                          onClick={() => handleAssignUser(index, null)}
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
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">No checklist items found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
