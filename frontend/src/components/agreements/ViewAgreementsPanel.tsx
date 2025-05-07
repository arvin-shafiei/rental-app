import React, { useState, useEffect } from 'react';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, 
  Label, Select, SelectItem, toast, Button 
} from '@/components/ui/FormElements';
import ViewChecklistItem from './ViewChecklistItem';
import { Property, PropertyUsers, Agreement } from '@/types/agreement';
import { getPropertyAgreements, getPropertyUsers, updateAgreementTask, deleteAgreement } from '@/lib/api';
import { Trash2 } from 'lucide-react';

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

  // Load property users and determine current user role when viewing an agreement
  useEffect(() => {
    const fetchViewPropertyUsers = async () => {
      if (!viewSelectedProperty) return;
      
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
            
            if (currentUser) {
              setUserRole(currentUser.user_role || null);
              setCurrentUserId(currentUser.user_id || null);
            } else {
              // Fallback - for demo purposes, use the first user with tenant role
              // In a real app, this would come from authentication
              const tenant = data.find(u => u.user_role === 'tenant');
              if (tenant) {
                setUserRole('tenant');
                setCurrentUserId(tenant.user_id);
              }
            }
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
  }, [viewSelectedProperty, selectedAgreementDetails]);
  
  // Update property if prop changes (e.g. after creating an agreement)
  useEffect(() => {
    if (selectedPropertyId && selectedPropertyId !== viewSelectedProperty) {
      setViewSelectedProperty(selectedPropertyId);
      setSelectedAgreement('');
    }
  }, [selectedPropertyId]);

  // Function to handle assigning a user to a task
  const handleAssignUser = async (itemIndex: number, userId: string | null, notificationDays?: number | null) => {
    if (!selectedAgreementDetails) return;
    
    try {
      setAssigningItem(itemIndex.toString());
      
      console.log('Assigning task with notification days:', {
        itemIndex,
        userId,
        notificationDays,
        notificationDaysType: typeof notificationDays
      });

      // Get current user ID (simplified for example)
      const currentUser = viewPropertyUsers.find(u => u.user_role === userRole);
      const currentUserId = currentUser?.user_id;
      
      // Create a copy of the agreement's check items for local state update
      const updatedItems = [...selectedAgreementDetails.check_items];
      const currentItem = updatedItems[itemIndex];
      
      console.log('Current item before update:', currentItem);
      
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
          <Label htmlFor="view-property">Select Property</Label>
          {isLoading ? (
            <p className="text-sm text-black">Loading properties...</p>
          ) : (
            <Select
              value={viewSelectedProperty}
              onValueChange={(value: string) => {
                setViewSelectedProperty(value);
                setSelectedAgreement('');
                setSelectedAgreementDetails(null);
              }}
              placeholder="Select a property"
            >
              {properties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.name || property.address}
                </SelectItem>
              ))}
            </Select>
          )}
        </div>

        {viewSelectedProperty && (
          <div className="space-y-2">
            <Label htmlFor="view-agreement">Select Agreement</Label>
            {loadingAgreements ? (
              <p className="text-sm text-black">Loading agreements...</p>
            ) : (
              <Select
                value={selectedAgreement}
                onValueChange={(value: string) => setSelectedAgreement(value)}
                placeholder="Select an agreement"
              >
                {agreements.map((agreement) => (
                  <SelectItem key={agreement.id} value={agreement.id}>
                    {agreement.title}
                  </SelectItem>
                ))}
              </Select>
            )}
          </div>
        )}

        {/* Display selected agreement details */}
        {selectedAgreementDetails && (
          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{selectedAgreementDetails.title}</h3>
              
              {/* Delete button - only show for property owners */}
              {userRole === 'owner' && (
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
            
            <p className="text-sm text-gray-500">
              Created at: {new Date(selectedAgreementDetails.created_at).toLocaleDateString()}
            </p>

            {/* Display checklist items */}
            <div className="space-y-3 mt-4">
              <h4 className="text-md font-medium">Checklist Items</h4>
              {selectedAgreementDetails.check_items.length === 0 ? (
                <p className="text-sm text-gray-500">No checklist items</p>
              ) : (
                <ul className="space-y-2">
                  {selectedAgreementDetails.check_items.map((item, index) => (
                    <ViewChecklistItem
                      key={index}
                      item={item}
                      users={viewPropertyUsers}
                      index={index}
                      onUpdateCheckItem={checked => handleUpdateCheckItem(index, checked)}
                      onAssignUser={(userId, notificationDays) => handleAssignUser(index, userId, notificationDays)}
                      isUpdating={updatingItem === index.toString()}
                      isAssigning={assigningItem === index.toString()}
                      canEdit={userRole === 'owner'}
                      currentUserId={currentUserId}
                      getUserEmail={getUserEmailById}
                    />
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