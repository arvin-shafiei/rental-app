'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Plus, 
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  ClipboardList,
  Bell,
  X,
  Trash2
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, isSameDay, compareAsc, compareDesc } from 'date-fns';
import { 
  getPropertyTimelineEvents, 
  syncPropertyTimeline,
  createTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  TimelineEvent,
  TimelineEventType,
  TimelineEventRecurrence
} from '@/lib/timelineApi';
import SyncTimelineDialog from './SyncTimelineDialog';
import TimelineEventCard from './TimelineEventCard';
import TimelineEventForm from './TimelineEventForm';
import CalendarExportDropdown from './CalendarExportDropdown';
import { createPortal } from 'react-dom';

interface PropertyTimelineProps {
  propertyId: string;
  propertyName: string;
}

export default function PropertyTimeline({ propertyId, propertyName }: PropertyTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showSimpleSetupDialog, setShowSimpleSetupDialog] = useState(false); 
  const [showClearConfirmDialog, setShowClearConfirmDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [calendarButtonPosition, setCalendarButtonPosition] = useState({ top: 0, left: 0 });
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [clearInProgress, setClearInProgress] = useState(false);
  
  // Simple setup form state
  const [simpleSetupOptions, setSimpleSetupOptions] = useState({
    includeInspections: true,
    includeMaintenanceReminders: true,
    includePropertyTaxes: false,
    includeInsurance: false,
    rentSetup: null as {
      autoGenerateRentDueDates: boolean;
      autoGenerateLeaseEvents: boolean;
      upfrontRentPaid: number;
      rentDueDay: number;
    } | null
  });
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  const [newEvent, setNewEvent] = useState({  
    title: '',
    description: '',
    event_type: TimelineEventType.OTHER,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    is_all_day: true,
    recurrence_type: TimelineEventRecurrence.NONE,
    notification_days_before: 3
  });
  
  const fetchEvents = useCallback(async () => {
    if (!propertyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching events for property: ${propertyId}`);
      const eventsData = await getPropertyTimelineEvents(propertyId);
      console.log("Raw API response:", JSON.stringify(eventsData, null, 2));
      
      // The API should return an array directly now
      if (Array.isArray(eventsData)) {
        console.log(`Total events received: ${eventsData.length}`);
        setEvents(eventsData);
        setIsFirstLoad(false);
      } else {
        console.warn("API response is not an array, setting empty events list");
        setEvents([]);
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);
  
  useEffect(() => {
    if (propertyId) {
      fetchEvents();
    }
  }, [propertyId, fetchEvents]);
  
  const handleQuickSetup = () => {
    setShowSimpleSetupDialog(true);
  };
  
  const handleSimpleSetupConfirm = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      // Get the start date from the component state
      const startDateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      const startDateValue = startDateInput?.value || format(new Date(), 'yyyy-MM-dd');
      
      const options = {
        autoGenerateRentDueDates: simpleSetupOptions.rentSetup?.autoGenerateRentDueDates || false,
        autoGenerateLeaseEvents: simpleSetupOptions.rentSetup?.autoGenerateLeaseEvents || false,
        upfrontRentPaid: simpleSetupOptions.rentSetup?.upfrontRentPaid || 0,
        rentDueDay: simpleSetupOptions.rentSetup?.rentDueDay || 1,
        includeInspections: simpleSetupOptions.includeInspections,
        includeMaintenanceReminders: simpleSetupOptions.includeMaintenanceReminders,
        includePropertyTaxes: simpleSetupOptions.includePropertyTaxes,
        includeInsurance: simpleSetupOptions.includeInsurance,
        startDate: startDateValue // Add the start date to options
      };
      
      await syncPropertyTimeline(propertyId, options);
      
      // Refresh events
      await fetchEvents();
      setShowSimpleSetupDialog(false);
    } catch (err: any) {
      setError(err.message || 'Failed to set up timeline');
      console.error('Error setting up timeline:', err);
    } finally {
      setSyncing(false);
    }
  };
  
  const handleCustomSetup = () => {
    setShowSyncDialog(true);
  };
  
  const handleSyncConfirm = async (options: {
    autoGenerateRentDueDates: boolean;
    autoGenerateLeaseEvents: boolean;
    upfrontRentPaid: number;
    rentDueDay: number;
    startDate: string;
  }) => {
    try {
      setSyncing(true);
      setError(null);
      
      console.log('Syncing timeline with options:', options);
      
      await syncPropertyTimeline(propertyId, {
        autoGenerateRentDueDates: options.autoGenerateRentDueDates,
        autoGenerateLeaseEvents: options.autoGenerateLeaseEvents,
        upfrontRentPaid: options.upfrontRentPaid,
        rentDueDay: options.rentDueDay,
        startDate: options.startDate
      });
      
      // Refresh events
      await fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to sync timeline');
      console.error('Error syncing timeline:', err);
      throw err; // Re-throw to be caught by the dialog
    } finally {
      setSyncing(false);
    }
  };
  
  const handleClearAllEvents = () => {
    setShowClearConfirmDialog(true);
  };
  
  const handleConfirmClearAll = async () => {
    try {
      setClearInProgress(true);
      setError(null);
      
      // Use the syncPropertyTimeline API with clearAllEvents flag
      await syncPropertyTimeline(propertyId, {
        autoGenerateRentDueDates: false,
        autoGenerateLeaseEvents: false,
        clearAllEvents: true
      });
      
      // Refresh events
      await fetchEvents();
      setShowClearConfirmDialog(false);
    } catch (err: any) {
      setError(err.message || 'Failed to clear events');
      console.error('Error clearing events:', err);
    } finally {
      setClearInProgress(false);
    }
  };
  
  const handleAddEvent = () => {
    setEditingEvent(null);
    setNewEvent({
      title: '',
      description: '',
      event_type: TimelineEventType.OTHER,
      start_date: format(new Date(), 'yyyy-MM-dd'),
      is_all_day: true,
      recurrence_type: TimelineEventRecurrence.NONE,
      notification_days_before: 3
    });
    setShowAddForm(true);
  };
  
  const handleEditEvent = (event: TimelineEvent) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type as TimelineEventType,
      start_date: event.start_date.split('T')[0], // Just the date part
      is_all_day: event.is_all_day,
      recurrence_type: event.recurrence_type as TimelineEventRecurrence,
      notification_days_before: event.notification_days_before || 3
    });
    setShowAddForm(true);
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      setError(null);
      await deleteTimelineEvent(eventId);
      await fetchEvents(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to delete event');
      console.error('Error deleting event:', err);
    }
  };
  
  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      if (editingEvent) {
        // Update existing event
        await updateTimelineEvent(editingEvent.id, {
          ...newEvent,
          property_id: propertyId
        });
      } else {
        // Create new event
        await createTimelineEvent({
          ...newEvent,
          property_id: propertyId
        });
      }
      
      setShowAddForm(false);
      await fetchEvents(); // Refresh the list
    } catch (err: any) {
      setError(err.message || `Failed to ${editingEvent ? 'update' : 'create'} event`);
      console.error(`Error ${editingEvent ? 'updating' : 'creating'} event:`, err);
    }
  };
  
  const handleToggleComplete = async (event: TimelineEvent) => {
    try {
      setError(null);
      await updateTimelineEvent(event.id, {
        is_completed: !event.is_completed
      });
      await fetchEvents(); // Refresh the list
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
      console.error('Error updating event:', err);
    }
  };

  // Add to calendar functionality
  const handleAddToCalendar = (event: TimelineEvent, e: React.MouseEvent) => {
    // Get position of the button to position the dropdown near it
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCalendarButtonPosition({
      top: buttonRect.bottom + window.scrollY,
      left: buttonRect.left + window.scrollX
    });
    
    console.log(`Adding event to calendar: ${event.title}`);
    console.log('Event data:', event);
    setSelectedEvent(event);
  };

  // Clear selected event when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (selectedEvent && !(e.target as Element).closest('.calendar-export-dropdown')) {
        setSelectedEvent(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedEvent]);

  // Filter events by current date
  const today = new Date();
  
  // Add console logs to debug date filtering
  console.log("Filtering events - Today's date:", today.toISOString());
  
  const upcomingEvents = events
    .filter((event) => {
      const eventDate = parseISO(event.start_date);
      const isUpcoming = isAfter(eventDate, today) || isSameDay(eventDate, today);
      // Debug each event date comparison
      console.log(`Event ${event.id}: Date=${event.start_date}, IsUpcoming=${isUpcoming}`);
      return isUpcoming;
    })
    .sort((a, b) => compareAsc(parseISO(a.start_date), parseISO(b.start_date)));

  const pastEvents = events
    .filter((event) => {
      const eventDate = parseISO(event.start_date);
      return isBefore(eventDate, today) && !isSameDay(eventDate, today);
    })
    .sort((a, b) => compareDesc(parseISO(a.start_date), parseISO(b.start_date)));
  
  // Clear All Confirmation Dialog
  const ClearConfirmDialog = () => {
    if (!showClearConfirmDialog || !mounted) return null;
    
    return createPortal(
      <div className="fixed inset-0 flex items-center justify-center z-50">
        {/* Semi-transparent backdrop */}
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setShowClearConfirmDialog(false)}
        ></div>
        
        {/* Dialog content */}
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full relative z-10 mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-red-600">Clear All Events</h2>
            <button 
              onClick={() => setShowClearConfirmDialog(false)}
              className="text-gray-400 hover:text-gray-500"
              disabled={clearInProgress}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="py-2 text-gray-700">
            <p className="mb-2">
              <strong>Warning:</strong> This will permanently delete all events for this property.
            </p>
            <p>This action cannot be undone. Are you sure you want to continue?</p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowClearConfirmDialog(false)}
              disabled={clearInProgress}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleConfirmClearAll} 
              disabled={clearInProgress}
              className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            >
              {clearInProgress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Events
                </>
              )}
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Calendar Export Dropdown */}
      {selectedEvent && (
        <CalendarExportDropdown
          event={selectedEvent}
          position={calendarButtonPosition}
          onClose={() => setSelectedEvent(null)}
          propertyName={propertyName}
        />
      )}

      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b">
        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Property Timeline
        </h3>
        <div className="flex space-x-2">
          {events.length > 0 && (
            <button
              onClick={handleClearAllEvents}
              disabled={clearInProgress}
              className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}
          <button
            onClick={handleAddEvent}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Event
          </button>
          <button
            onClick={handleCustomSetup}
            disabled={syncing}
            className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
              syncing
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Rent & Lease
          </button>
        </div>
      </div>

      {/* Event list */}
      <div className="px-4 py-5 sm:px-6">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : events.length === 0 ? (
          <div className="py-6">
            <div className="mb-6 border-b pb-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Let's Set Up Your Timeline</h3>
                <p className="text-sm text-gray-500 mt-1">Easily manage important dates for your property</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mb-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-100 rounded-full p-2 mr-3">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-800">Property Inspections</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Schedule recurring property inspection reminders</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center mb-2">
                    <div className="bg-green-100 rounded-full p-2 mr-3">
                      <Bell className="h-5 w-5 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-800">Maintenance Checks</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Regular maintenance reminders for your property</p>
                </div>
              </div>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleCustomSetup}
                  disabled={syncing}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors shadow-sm"
                >
                  {syncing ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </span>
                  ) : (
                    'Set Up Timeline'
                  )}
                </button>
              </div>
            </div>
            <div className="flex justify-center items-center">
              <div className="text-center max-w-md">
                <h4 className="font-medium text-gray-800 mb-2">Or add events manually</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Create custom events like repairs, insurance renewals, or other important dates.
                </p>
                <button
                  onClick={handleAddEvent}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Event
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {upcomingEvents.length > 0 && (
              <div className="mb-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">Upcoming Events</h4>
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <TimelineEventCard
                      key={event.id}
                      event={event}
                      isPast={false}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                      onToggleComplete={handleToggleComplete}
                      onAddToCalendar={handleAddToCalendar}
                      propertyName={propertyName}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {pastEvents.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Past Events</h4>
                <div className="space-y-4">
                  {pastEvents.map((event) => (
                    <TimelineEventCard
                      key={event.id}
                      event={event}
                      isPast={true}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                      onToggleComplete={handleToggleComplete}
                      onAddToCalendar={handleAddToCalendar}
                      propertyName={propertyName}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Event Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <TimelineEventForm
            editingEvent={editingEvent}
            initialValues={newEvent}
            onSubmit={handleSubmitEvent}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Sync Timeline Dialog */}
      {showSyncDialog && (
        <SyncTimelineDialog
          isOpen={showSyncDialog}
          onClose={() => setShowSyncDialog(false)}
          onConfirm={handleSyncConfirm}
          propertyName={propertyName}
        />
      )}
      
      {/* Clear Confirmation Dialog */}
      <ClearConfirmDialog />
    </div>
  );
} 