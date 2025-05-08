import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, 
  Button, Input, toast 
} from '@/components/ui/FormElements';
import { format, parseISO, isValid, addDays } from 'date-fns';
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, ChevronsUpDown, Check } from 'lucide-react';
import ChecklistItem from './ChecklistItem';
import { Property, PropertyUsers, CheckItem, ApiCheckItem } from '@/types/agreement';
import { getPropertyUsers, createAgreement, getPropertyAgreements, AgreementData as ApiAgreementData } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

interface CreateAgreementFormProps {
  properties: Property[];
  isLoading: boolean;
  onAgreementCreated: (propertyId: string) => void;
}

// Calendar component for selecting dates
const DatePicker = ({
  selectedDate,
  onDateChange
}: {
  selectedDate: string;
  onDateChange: (date: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Date>(selectedDate ? parseISO(selectedDate) : new Date());
  
  // Format a date for display
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'Select date';
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd MMM yyyy') : 'Select date';
  };
  
  // Get month name and year for the calendar header
  const monthYearDisplay = format(viewMonth, 'MMMM yyyy');
  
  // Generate days for the current month view
  const daysInMonth = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    
    // Get day of week for the first day (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Adjust for Monday as first day of week
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: 0, date: null }); // Empty cell
    }
    
    // Add actual days of the month
    for (let i = 1; i <= daysCount; i++) {
      days.push({ 
        day: i, 
        date: new Date(year, month, i) 
      });
    }
    
    return days;
  }, [viewMonth]);
  
  // Handle date selection
  const handleDateSelect = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    onDateChange(dateString);
    setIsOpen(false);
  };
  
  // Go to previous month
  const prevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };
  
  // Go to next month
  const nextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1));
  };
  
  // Check if a date is selected
  const isSelectedDate = (date: Date) => {
    if (!date || !selectedDate) return false;
    return format(date, 'yyyy-MM-dd') === selectedDate;
  };
  
  // Get appropriate class for a calendar day
  const getDayClass = (date: Date | null) => {
    if (!date) return "invisible";
    
    // Disable past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = date < today;
    
    let baseClass = "h-10 w-10 rounded-full flex items-center justify-center";
    
    if (isPast) {
      return `${baseClass} text-gray-300 cursor-not-allowed`;
    }
    
    baseClass += " cursor-pointer";
    
    if (isSelectedDate(date)) {
      return `${baseClass} bg-blue-600 text-white font-bold`;
    } else {
      return `${baseClass} hover:bg-blue-50`;
    }
  };
  
  // Day names for the header
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="relative">
      <div 
        className="flex items-center border rounded-md p-2 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex-grow text-black">{formatDateForDisplay(selectedDate)}</span>
        <CalendarIcon className="h-5 w-5 text-gray-500" />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-lg">
          <div className="p-4">
            {/* Calendar Header */}
            <div className="flex justify-between items-center mb-4">
              <button 
                type="button"
                onClick={prevMonth}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Previous month"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="font-bold">{monthYearDisplay}</div>
              <button 
                type="button"
                onClick={nextMonth}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Next month"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            
            {/* Calendar Days Header */}
            <div className="grid grid-cols-7 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day, i) => (
                <div 
                  key={i} 
                  className={getDayClass(day.date)}
                  onClick={() => day.date && handleDateSelect(day.date)}
                >
                  {day.day || ''}
                </div>
              ))}
            </div>
            
            {/* Quick Date Options */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex space-x-2">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
                onClick={() => {
                  const today = new Date();
                  handleDateSelect(today);
                }}
              >
                Today
              </button>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
                onClick={() => {
                  const nextWeek = addDays(new Date(), 7);
                  handleDateSelect(nextWeek);
                }}
              >
                Next Week
              </button>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
                onClick={() => {
                  const nextMonth = addDays(new Date(), 30);
                  handleDateSelect(nextMonth);
                }}
              >
                Next Month
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateAgreementForm = ({ 
  properties, 
  isLoading,
  onAgreementCreated 
}: CreateAgreementFormProps) => {
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [propertyUsers, setPropertyUsers] = useState<PropertyUsers[]>([]);
  const [agreementTitle, setAgreementTitle] = useState<string>('');
  const [agreementDueDate, setAgreementDueDate] = useState<string>('');
  const [checkItems, setCheckItems] = useState<CheckItem[]>([
    { id: '1', text: '', checked: false, assignedTo: null, notificationDaysBefore: null }
  ]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Find the selected property object
  const selectedPropertyObject = properties.find(p => p.id === selectedProperty);

  // Auto select the first property if none selected and properties are available
  useEffect(() => {
    if (!selectedProperty && properties.length > 0 && !isLoading) {
      setSelectedProperty(properties[0].id);
    }
  }, [properties, isLoading, selectedProperty]);

  // Fetch property users when a property is selected
  useEffect(() => {
    const fetchPropertyUsers = async () => {
      if (!selectedProperty) return;
      
      try {
        setLoading(true);
        const data = await getPropertyUsers(selectedProperty);
        // Include all property users, not just tenants
        const users = Array.isArray(data) ? data : [];
        setPropertyUsers(users);
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
      { id: Date.now().toString(), text: '', checked: false, assignedTo: null, notificationDaysBefore: null }
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

  const handleNotificationDaysChange = (id: string, days: number | null) => {
    setCheckItems(
      checkItems.map(item => 
        item.id === id ? { ...item, notificationDaysBefore: days } : item
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

    if (!agreementDueDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select a due date for the agreement',
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
        assigned_to: item.assignedTo || null,
        notification_days_before: item.notificationDaysBefore
      }));

      // Create the agreement data with the type expected by the API
      const agreementData: ApiAgreementData = {
        title: agreementTitle,
        propertyId: selectedProperty,
        checkItems: apiCheckItems,
        dueDate: agreementDueDate || undefined
      };

      // Log what's being sent to the API for debugging
      console.log('Creating agreement with data:', JSON.stringify(agreementData, null, 2));

      // Send to the API
      await createAgreement(agreementData);

      toast({
        title: 'Success',
        description: 'Agreement created successfully!',
      });

      // Reset the form after successful submission
      setAgreementTitle('');
      setAgreementDueDate('');
      setSelectedProperty('');
      setCheckItems([{ id: '1', text: '', checked: false, assignedTo: null, notificationDaysBefore: null }]);
      
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
          Create a new agreement to share with all users of this property
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
                      onClick={() => setSelectedProperty(property.id)}
                    >
                      <span>{property.name || property.address}</span>
                      {property.id === selectedProperty && (
                        <Check className="ml-auto h-4 w-4 text-blue-600" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {selectedProperty && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Users who will receive this agreement:</label>
            <div className="border rounded-md p-3 bg-gray-50">
              {loading ? (
                <div className="flex space-x-2">
                  <div className="h-5 w-5 bg-gray-100 rounded-full animate-pulse"></div>
                  <div className="h-5 w-32 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ) : propertyUsers.length > 0 ? (
                <ul className="text-sm text-gray-700 space-y-1">
                  {propertyUsers.map((user) => (
                    <li key={user.id} className="flex items-center">
                      <div className={`h-2 w-2 rounded-full mr-2 ${user.user_role === 'owner' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      {user.profile?.display_name || user.profile?.email || user.user_id}
                      {user.user_role === 'owner' ? ' (Owner)' : ' (Tenant)'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No users found for this property</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Agreement Title</label>
          <Input
            id="title"
            placeholder="Enter agreement title"
            value={agreementTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAgreementTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
          <DatePicker 
            selectedDate={agreementDueDate} 
            onDateChange={setAgreementDueDate} 
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Checklist Items</label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddCheckItem} 
              className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded"
            >
              Add Item
            </Button>
          </div>
          <div className="space-y-3 border border-gray-200 rounded-md p-4">
            {checkItems.map((item) => (
              <ChecklistItem
                key={item.id}
                item={item}
                propertyUsers={propertyUsers}
                onTextChange={handleCheckItemChange}
                onCheckedChange={handleCheckboxChange}
                onAssignChange={handleAssignChange}
                onNotificationDaysChange={handleNotificationDaysChange}
                selectedProperty={selectedProperty}
              />
            ))}
          </div>
        </div>

        <Button 
          className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-4" 
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