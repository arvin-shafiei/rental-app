'use client';

import { useState, useEffect } from 'react';
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
  Home
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
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
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_type: TimelineEventType.CUSTOM,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    is_all_day: true,
    recurrence_type: TimelineEventRecurrence.NONE,
    notification_days_before: 3
  });
  
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getPropertyTimelineEvents(propertyId);
      setEvents(result.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load timeline events');
      console.error('Error loading timeline events:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (propertyId) {
      fetchEvents();
    }
  }, [propertyId]);
  
  const handleSyncTimeline = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      await syncPropertyTimeline(propertyId, {
        autoGenerateRentDueDates: true,
        autoGenerateLeaseEvents: true
      });
      
      // Refresh events
      await fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to sync timeline');
      console.error('Error syncing timeline:', err);
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
  
  // Group events by status (upcoming/past)
  const today = new Date();
  const upcomingEvents = events.filter(event => 
    !event.is_completed && isAfter(parseISO(event.start_date), addDays(today, -1))
  ).sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  
  const pastEvents = events.filter(event => 
    event.is_completed || isBefore(parseISO(event.start_date), today)
  ).sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b">
        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Property Timeline
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={handleSyncTimeline}
            disabled={syncing}
            className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Sync Events
          </button>
          <button
            onClick={handleAddEvent}
            className="inline-flex items-center rounded-md bg-blue-600 px-2 py-1 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Event
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {showAddForm && (
        <div className="p-4 border-b">
          <h4 className="font-medium mb-3">
            {editingEvent ? 'Edit Event' : 'Add New Event'}
          </h4>
          <form onSubmit={handleSubmitEvent}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Event Type</label>
                <select
                  value={newEvent.event_type}
                  onChange={(e) => setNewEvent({...newEvent, event_type: e.target.value as TimelineEventType})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value={TimelineEventType.CUSTOM}>Custom</option>
                  <option value={TimelineEventType.MAINTENANCE}>Maintenance</option>
                  <option value={TimelineEventType.INSPECTION}>Inspection</option>
                  <option value={TimelineEventType.RENT_DUE}>Rent Due</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  required
                  value={newEvent.start_date}
                  onChange={(e) => setNewEvent({...newEvent, start_date: e.target.value})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Recurrence</label>
                <select
                  value={newEvent.recurrence_type}
                  onChange={(e) => setNewEvent({...newEvent, recurrence_type: e.target.value as TimelineEventRecurrence})}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value={TimelineEventRecurrence.NONE}>None</option>
                  <option value={TimelineEventRecurrence.MONTHLY}>Monthly</option>
                  <option value={TimelineEventRecurrence.YEARLY}>Yearly</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              
              <div className="md:col-span-2 flex items-center">
                <input
                  type="checkbox"
                  id="is_all_day"
                  checked={newEvent.is_all_day}
                  onChange={(e) => setNewEvent({...newEvent, is_all_day: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_all_day" className="ml-2 block text-sm text-gray-900">
                  All Day Event
                </label>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding a new event or syncing your timeline.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <button
              onClick={handleSyncTimeline}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Timeline
            </button>
            <button
              onClick={handleAddEvent}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {upcomingEvents.length > 0 && (
            <div>
              <h4 className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500">Upcoming Events</h4>
              <ul className="divide-y divide-gray-200">
                {upcomingEvents.map(event => (
                  <li key={event.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getEventIcon(event.event_type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(event.start_date), 'MMM d, yyyy')}
                          </p>
                          {event.description && (
                            <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleComplete(event)}
                          className="rounded p-1 text-gray-400 hover:text-gray-500"
                        >
                          {event.is_completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="rounded p-1 text-gray-400 hover:text-gray-500"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="rounded p-1 text-gray-400 hover:text-gray-500"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {pastEvents.length > 0 && (
            <div>
              <h4 className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-500">Past Events</h4>
              <ul className="divide-y divide-gray-200">
                {pastEvents.map(event => (
                  <li key={event.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getEventIcon(event.event_type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-500">
                            {format(parseISO(event.start_date), 'MMM d, yyyy')}
                          </p>
                          {event.description && (
                            <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleComplete(event)}
                          className="rounded p-1 text-gray-400 hover:text-gray-500"
                        >
                          {event.is_completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="rounded p-1 text-gray-400 hover:text-gray-500"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="rounded p-1 text-gray-400 hover:text-gray-500"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 