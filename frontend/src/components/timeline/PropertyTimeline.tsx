'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Circle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Home,
  Check,
  CalendarIcon
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addDays, isSameDay, compareAsc, compareDesc } from 'date-fns';
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
import CalendarExport from '@/components/CalendarExport';

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
  }) => {
    try {
      setSyncing(true);
      setError(null);
      
      console.log('Syncing timeline with options:', options);
      
      await syncPropertyTimeline(propertyId, {
        autoGenerateRentDueDates: options.autoGenerateRentDueDates,
        autoGenerateLeaseEvents: options.autoGenerateLeaseEvents,
        upfrontRentPaid: options.upfrontRentPaid
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
      event_type: TimelineEventType.CUSTOM,
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

  // Prepare event data for calendar export
  const prepareEventForCalendar = (event: TimelineEvent) => {
    // Make sure we have valid dates
    const startDate = parseISO(event.start_date);
    // If endDate is not provided, use startDate + 1 hour
    let endDate;
    if (event.end_date) {
      endDate = parseISO(event.end_date);
    } else {
      endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);
    }
    
    // Handle invalid dates
    if (isNaN(startDate.getTime())) {
      console.error('Invalid start date:', event.start_date);
      // Use current date instead of null
      const now = new Date();
      const oneHourLater = new Date(now);
      oneHourLater.setHours(oneHourLater.getHours() + 1);
      
      return {
        title: event.title || 'Untitled Event',
        description: event.description || `${formatEventType(event.event_type)} for property ${propertyName}`,
        startDateTime: now.toISOString(),
        endDateTime: oneHourLater.toISOString(),
        location: propertyName
      };
    }
    
    if (isNaN(endDate.getTime())) {
      console.error('Invalid end date:', endDate);
      endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);
    }
    
    // Format dates in ISO format
    const calendarEvent = {
      title: event.title || 'Untitled Event',
      description: event.description || `${formatEventType(event.event_type)} for property ${propertyName}`,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      location: propertyName
    };
    
    console.log('Prepared calendar event:', calendarEvent);
    return calendarEvent;
  };
  
  const getEventIcon = (type: string) => {
    switch (type) {
      case TimelineEventType.LEASE_START:
      case TimelineEventType.LEASE_END:
        return <Home className="h-5 w-5 text-blue-600" />;
      case TimelineEventType.RENT_DUE:
        return <Calendar className="h-5 w-5 text-green-600" />;
      case TimelineEventType.INSPECTION:
        return <CheckCircle2 className="h-5 w-5 text-orange-600" />;
      case TimelineEventType.MAINTENANCE:
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  // Format event type for display
  const formatEventType = (type: string): string => {
    switch (type) {
      case TimelineEventType.LEASE_START:
        return 'Lease Start';
      case TimelineEventType.LEASE_END:
        return 'Lease End';
      case TimelineEventType.RENT_DUE:
        return 'Rent Due';
      case TimelineEventType.INSPECTION:
        return 'Inspection';
      case TimelineEventType.MAINTENANCE:
        return 'Maintenance';
      case TimelineEventType.CUSTOM:
        return 'Custom Event';
      default:
        return type;
    }
  };
  
  const [newEvent, setNewEvent] = useState({  
    title: '',
    description: '',
    event_type: TimelineEventType.CUSTOM,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    is_all_day: true,
    recurrence_type: TimelineEventRecurrence.NONE,
    notification_days_before: 3
  });
  
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
      {/* Calendar Export Dropdown - appears as a dropdown rather than fullscreen */}
      {selectedEvent && (
        <div 
          className="calendar-export-dropdown absolute z-50 bg-white rounded-lg shadow-xl p-4 border border-gray-200"
          style={{
            top: `${calendarButtonPosition.top}px`,
            left: `${calendarButtonPosition.left}px`,
            maxWidth: '300px',
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-900">
                Add to Calendar
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              {selectedEvent.title}
            </p>
            <CalendarExport 
              eventData={prepareEventForCalendar(selectedEvent)} 
            />
          </div>
        </div>
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
                    <div key={event.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getEventIcon(event.event_type)}</div>
                          <div>
                            <div className="flex items-center">
                              <h5 className="text-md font-medium text-gray-900">{event.title}</h5>
                            </div>
                            <p className="text-sm text-gray-500">
                              {format(parseISO(event.start_date), 'MMM d, yyyy')}
                              {event.is_all_day ? '' : ` at ${format(parseISO(event.start_date), 'h:mm a')}`}
                            </p>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {formatEventType(event.event_type)}
                              </span>
                              {event.recurrence_type !== 'none' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {event.recurrence_type}
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              <button 
                                onClick={(e) => handleAddToCalendar(event, e)}
                                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                              >
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Add to Calendar
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleComplete(event)}
                            className="text-gray-400 hover:text-green-500 p-1"
                            title={event.is_completed ? "Mark as incomplete" : "Mark as completed"}
                          >
                            {event.is_completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Edit event"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Delete event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {pastEvents.length > 0 && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">Past Events</h4>
                <div className="space-y-4">
                  {pastEvents.map((event) => (
                    <div key={event.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">{getEventIcon(event.event_type)}</div>
                          <div>
                            <div className="flex items-center">
                              <h5 className="text-md font-medium text-gray-800">{event.title}</h5>
                            </div>
                            <p className="text-sm text-gray-500">
                              {format(parseISO(event.start_date), 'MMM d, yyyy')}
                              {event.is_all_day ? '' : ` at ${format(parseISO(event.start_date), 'h:mm a')}`}
                            </p>
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {formatEventType(event.event_type)}
                              </span>
                              {event.recurrence_type !== 'none' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {event.recurrence_type}
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              <button 
                                onClick={(e) => handleAddToCalendar(event, e)}
                                className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                              >
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Add to Calendar
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleComplete(event)}
                            className="text-gray-400 hover:text-green-500 p-1"
                            title={event.is_completed ? "Mark as incomplete" : "Mark as completed"}
                          >
                            {event.is_completed ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditEvent(event)}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="Edit event"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Delete event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Event Form */}
      {showAddForm && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-medium mb-4 text-gray-900">
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </h3>
            
            <form onSubmit={handleSubmitEvent}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Event Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={2}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="event_type" className="block text-sm font-medium text-gray-700">
                    Event Type
                  </label>
                  <select
                    id="event_type"
                    name="event_type"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent({ ...newEvent, event_type: e.target.value as TimelineEventType })}
                  >
                    <option value={TimelineEventType.CUSTOM}>Custom</option>
                    <option value={TimelineEventType.RENT_DUE}>Rent Due</option>
                    <option value={TimelineEventType.INSPECTION}>Inspection</option>
                    <option value={TimelineEventType.MAINTENANCE}>Maintenance</option>
                    <option value={TimelineEventType.LEASE_START}>Lease Start</option>
                    <option value={TimelineEventType.LEASE_END}>Lease End</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    id="start_date"
                    required
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={newEvent.start_date}
                    onChange={(e) => setNewEvent({ ...newEvent, start_date: e.target.value })}
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    id="is_all_day"
                    name="is_all_day"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={newEvent.is_all_day}
                    onChange={(e) => setNewEvent({ ...newEvent, is_all_day: e.target.checked })}
                  />
                  <label htmlFor="is_all_day" className="ml-2 block text-sm text-gray-900">
                    All-day event
                  </label>
                </div>
                
                <div>
                  <label htmlFor="recurrence_type" className="block text-sm font-medium text-gray-700">
                    Recurrence
                  </label>
                  <select
                    id="recurrence_type"
                    name="recurrence_type"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={newEvent.recurrence_type}
                    onChange={(e) => setNewEvent({ ...newEvent, recurrence_type: e.target.value as TimelineEventRecurrence })}
                  >
                    <option value={TimelineEventRecurrence.NONE}>None</option>
                    <option value={TimelineEventRecurrence.DAILY}>Daily</option>
                    <option value={TimelineEventRecurrence.WEEKLY}>Weekly</option>
                    <option value={TimelineEventRecurrence.MONTHLY}>Monthly</option>
                    <option value={TimelineEventRecurrence.YEARLY}>Yearly</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="notification_days_before" className="block text-sm font-medium text-gray-700">
                    Notification Days Before
                  </label>
                  <input
                    type="number"
                    name="notification_days_before"
                    id="notification_days_before"
                    min="0"
                    max="30"
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                    value={newEvent.notification_days_before}
                    onChange={(e) => setNewEvent({ ...newEvent, notification_days_before: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
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