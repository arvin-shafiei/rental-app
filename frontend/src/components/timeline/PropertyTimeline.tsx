'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Plus, 
  RefreshCw,
  Loader2,
  AlertCircle
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
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [calendarButtonPosition, setCalendarButtonPosition] = useState({ top: 0, left: 0 });
  
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
  
  const handleSyncTimeline = () => {
    setShowSyncDialog(true);
  };
  
  const handleSyncConfirm = async (options: {
    autoGenerateRentDueDates: boolean;
    autoGenerateLeaseEvents: boolean;
    upfrontRentPaid: number;
    rentDueDay: number;
  }) => {
    try {
      setSyncing(true);
      setError(null);
      
      console.log('Syncing timeline with options:', options);
      
      await syncPropertyTimeline(propertyId, {
        autoGenerateRentDueDates: options.autoGenerateRentDueDates,
        autoGenerateLeaseEvents: options.autoGenerateLeaseEvents,
        upfrontRentPaid: options.upfrontRentPaid,
        rentDueDay: options.rentDueDay
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
          <button
            onClick={handleSyncTimeline}
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
            Generate Events
          </button>
          <button
            onClick={handleAddEvent}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Event
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
          <div className="text-center py-6">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
            <div className="mt-6">
              <button
                onClick={handleAddEvent}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-5 w-5 mr-2" />
                New Event
              </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-opacity-30" onClick={() => setShowAddForm(false)}></div>
          <div className="z-10">
            <TimelineEventForm
              editingEvent={editingEvent}
              initialValues={newEvent}
              onSubmit={handleSubmitEvent}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
      
      {/* Sync timeline dialog */}
      {showSyncDialog && (
        <SyncTimelineDialog
          isOpen={showSyncDialog}
          onClose={() => setShowSyncDialog(false)}
          onConfirm={handleSyncConfirm}
          propertyName={propertyName}
        />
      )}
    </div>
  );
} 