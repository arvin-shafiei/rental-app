import React, { useState, useEffect } from 'react';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, 
  toast, Button 
} from '@/components/ui/FormElements';
import ViewChecklistItem from './ViewChecklistItem';
import { Property, PropertyUsers, Agreement } from '@/types/agreement';
import { getPropertyAgreements, getPropertyUsers, updateAgreementTask, deleteAgreement } from '@/lib/api';
import { Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface ViewAgreementsPanelProps {
  properties: Property[];
  isLoading: boolean;
  selectedPropertyId?: string;
  onAgreementDeleted?: () => void;
}

const ViewAgreementsPanel = ({ 
  properties, 
  isLoading,
  selectedPropertyId,
  onAgreementDeleted
}: ViewAgreementsPanelProps) => {
  const [viewSelectedProperty, setViewSelectedProperty] = useState<string>(selectedPropertyId || '');
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loadingAgreements, setLoadingAgreements] = useState<boolean>(false);
  const [selectedAgreement, setSelectedAgreement] = useState<string>('');
  const [selectedAgreementDetails, setSelectedAgreementDetails] = useState<Agreement | null>(null);
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [viewPropertyUsers, setViewPropertyUsers] = useState<PropertyUsers[]>([]);
  const [assigningItem, setAssigningItem] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Find the selected property object
  const selectedPropertyObject = properties.find(p => p.id === viewSelectedProperty);

  // Fetch agreements when a property is selected
  useEffect(() => {
    const fetchAgreements = async () => {
      if (!viewSelectedProperty) return;
      
      try {
        setLoadingAgreements(true);
        const agreementsData = await getPropertyAgreements(viewSelectedProperty);
        
        if (Array.isArray(agreementsData)) {
          setAgreements(agreementsData);
          console.log('Agreements loaded:', agreementsData);
          
          // Auto-select the first agreement if available and none is currently selected
          if (agreementsData.length > 0 && !selectedAgreement) {
            setSelectedAgreement(agreementsData[0].id);
          }
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
  }, [viewSelectedProperty]);
  
  // Update selected agreement details when an agreement is selected
  useEffect(() => {
    if (selectedAgreement) {
      const agreement = agreements.find(a => a.id === selectedAgreement);
      setSelectedAgreementDetails(agreement || null);
    } else {
      setSelectedAgreementDetails(null);
    }
  }, [selectedAgreement, agreements]);

  // Load property users and get the current user ID from auth
  useEffect(() => {
    const fetchViewPropertyUsers = async () => {
      if (!viewSelectedProperty) return;
      
      try {
        // Get the current user from Supabase auth
        const { data: authData } = await supabase.auth.getSession();
        const loggedInUserId = authData.session?.user?.id;
        
        console.log('Current logged in user ID:', loggedInUserId);
        setCurrentUserId(loggedInUserId || null);
        
        // Get all property users
        const data = await getPropertyUsers(viewSelectedProperty);
        
        if (Array.isArray(data)) {
          setViewPropertyUsers(data);
          
          // Find the current user's role in this property
          const currentUserData = data.find(u => u.user_id === loggedInUserId);
          if (currentUserData) {
            setUserRole(currentUserData.user_role);
            console.log('Current user role in property:', currentUserData.user_role);
          } else {
            console.warn('Current user not found in property users');
          }
          
          // Print all user IDs available for testing
          console.log('All property users:', data.map(u => ({
            userId: u.user_id,
            role: u.user_role,
            email: u.profile?.email || 'No email'
          })));
        } else {
          console.warn('No property users found');
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
  }, [viewSelectedProperty]);
  
  // Update property if prop changes (e.g. after creating an agreement)
  useEffect(() => {
    if (selectedPropertyId && selectedPropertyId !== viewSelectedProperty) {
      setViewSelectedProperty(selectedPropertyId);
      setSelectedAgreement('');
    }
  }, [selectedPropertyId]);

  // Function to handle assigning a user to a task
  const handleAssignUser = async (itemIndex: number, userId: string | null, notificationDays?: number | null) => {
    if (!selectedAgreementDetails || !currentUserId) return;
    
    try {
      setAssigningItem(itemIndex.toString());
      
      console.log('Assigning task with notification days:', {
        itemIndex,
        userId,
        notificationDays,
        notificationDaysType: typeof notificationDays
      });
      
      // Create a copy of the agreement's check items for local state update
      const updatedItems = [...selectedAgreementDetails.check_items];
      const currentItem = updatedItems[itemIndex];
      
      console.log('Current item before update:', currentItem);
      
      // Check if current user is the creator of the agreement
      const isCreator = selectedAgreementDetails.created_by === currentUserId;
      
      // Check permissions (client-side validation)
      if (!isCreator) {
        // Non-creators can only assign/unassign themselves
        if (userId !== null && userId !== currentUserId) {
          toast({
            title: 'Permission Error',
            description: 'You can only assign tasks to yourself',
            variant: 'destructive',
          });
          setAssigningItem(null);
          return;
        }
        
        // For unassigning, check if they're unassigning someone else
        if (userId === null && currentItem.assigned_to && currentItem.assigned_to !== currentUserId) {
          toast({
            title: 'Permission Error',
            description: 'You can only unassign tasks assigned to you',
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
          userId,
          notificationDays
        );
        
        // If successful, update local state
        if (result) {
          // Update the item in our local state
          updatedItems[itemIndex] = {
            ...currentItem,
            assigned_to: userId,
            notification_days_before: notificationDays
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
            description: userId 
              ? 'Task assigned successfully' 
              : 'Task unassigned successfully',
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
  
  // Function to handle updating a check item (checked/unchecked)
  const handleUpdateCheckItem = async (itemIndex: number, checked: boolean) => {
    if (!selectedAgreementDetails || !currentUserId) return;
    
    try {
      setUpdatingItem(itemIndex.toString());
      
      // Create a copy of the agreement's check items
      const updatedItems = [...selectedAgreementDetails.check_items];
      const currentItem = updatedItems[itemIndex];
      
      // Check if current user is the creator of the agreement
      const isCreator = selectedAgreementDetails.created_by === currentUserId;
      
      // Check permissions
      // Creators can update any item
      // Others can only update items assigned to them or unassigned items
      if (!isCreator && 
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
  
  // Find user email by ID
  const getUserEmailById = (userId: string | null): string => {
    if (!userId) return 'Unassigned';
    
    const user = viewPropertyUsers.find(u => u.user_id === userId);
    return user?.profile?.email || user?.profile?.display_name || userId;
  };

  // Function to handle agreement deletion
  const handleDeleteAgreement = async () => {
    if (!selectedAgreementDetails) return;
    
    // Confirm with user before deletion
    if (!window.confirm(`Are you sure you want to delete the agreement "${selectedAgreementDetails.title}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      setDeleting(true);
      
      await deleteAgreement(selectedAgreementDetails.id);
      
      // Remove the agreement from state
      setAgreements(agreements.filter(a => a.id !== selectedAgreementDetails.id));
      setSelectedAgreement('');
      setSelectedAgreementDetails(null);
      
      toast({
        title: 'Success',
        description: 'Agreement deleted successfully',
      });
      
      // Call the callback if it exists
      if (onAgreementDeleted) {
        onAgreementDeleted();
      }
    } catch (error) {
      console.error('Error deleting agreement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete agreement',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Auto select the first property if none selected and properties are available
  useEffect(() => {
    if (!viewSelectedProperty && properties.length > 0 && !isLoading) {
      setViewSelectedProperty(properties[0].id);
    }
  }, [properties, isLoading, viewSelectedProperty]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>View Agreements</CardTitle>
        <CardDescription>
          View and manage property agreements and check items
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select Property</label>
          {isLoading ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded"></div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 text-gray-600 focus:ring-blue-500 focus:border-blue-500">
                <span className="truncate">
                  {selectedPropertyObject ? selectedPropertyObject.name || selectedPropertyObject.address : 'Select a property'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 text-gray-500 flex-shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full max-h-[400px] overflow-y-auto" align="start">
                <DropdownMenuLabel>Your Properties</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {properties.length === 0 ? (
                  <DropdownMenuItem disabled>No properties available</DropdownMenuItem>
                ) : (
                  properties.map((property) => (
                    <DropdownMenuItem
                      key={property.id}
                      onClick={() => {
                        setViewSelectedProperty(property.id);
                        setSelectedAgreement('');
                        setSelectedAgreementDetails(null);
                      }}
                    >
                      <span>{property.name || property.address}</span>
                      {property.id === viewSelectedProperty && (
                        <Check className="ml-auto h-4 w-4 text-blue-600" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {viewSelectedProperty && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Select Agreement</label>
            {loadingAgreements ? (
              <div className="h-10 bg-gray-100 animate-pulse rounded"></div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 text-gray-600 focus:ring-blue-500 focus:border-blue-500">
                  <span className="truncate">
                    {selectedAgreementDetails ? selectedAgreementDetails.title : 'Select an agreement'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 text-gray-500 flex-shrink-0" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full max-h-[400px] overflow-y-auto" align="start">
                  <DropdownMenuLabel>Agreements</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {agreements.length === 0 ? (
                    <DropdownMenuItem disabled>No agreements available</DropdownMenuItem>
                  ) : (
                    agreements.map((agreement) => (
                      <DropdownMenuItem 
                        key={agreement.id}
                        onClick={() => setSelectedAgreement(agreement.id)}
                      >
                        <span>{agreement.title}</span>
                        {agreement.id === selectedAgreement && (
                          <Check className="ml-auto h-4 w-4 text-blue-600" />
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Display selected agreement details */}
        {selectedAgreementDetails && (
          <div className="mt-8 space-y-4 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{selectedAgreementDetails.title}</h3>
              
              {/* Only show delete button if user is the creator */}
              {selectedAgreementDetails.created_by === currentUserId && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAgreement}
                  disabled={deleting}
                  className="flex gap-2 items-center"
                >
                  <Trash2 size={16} />
                  {deleting ? 'Deleting...' : 'Delete Agreement'}
                </Button>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Created at: {new Date(selectedAgreementDetails.created_at).toLocaleDateString()}
              </p>
              
              {selectedAgreementDetails.due_date && (
                <p className="text-sm font-medium text-amber-600">
                  Due date: {new Date(selectedAgreementDetails.due_date).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Display checklist items */}
            <div className="mt-6">
              <h4 className="text-md font-medium mb-4">Checklist Items</h4>
              {selectedAgreementDetails.check_items.length === 0 ? (
                <p className="text-sm text-gray-500">No checklist items</p>
              ) : (
                <ul className="space-y-2 border border-gray-200 rounded-md divide-y divide-gray-200">
                  {selectedAgreementDetails.check_items.map((item, index) => (
                    <li key={index} className="px-1 py-2">
                      <ViewChecklistItem
                        item={item}
                        users={viewPropertyUsers}
                        index={index}
                        onUpdateCheckItem={checked => handleUpdateCheckItem(index, checked)}
                        onAssignUser={(userId, notificationDays) => handleAssignUser(index, userId, notificationDays)}
                        isUpdating={updatingItem === index.toString()}
                        isAssigning={assigningItem === index.toString()}
                        canEdit={selectedAgreementDetails.created_by === currentUserId}
                        currentUserId={currentUserId}
                        getUserEmail={getUserEmailById}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ViewAgreementsPanel; 