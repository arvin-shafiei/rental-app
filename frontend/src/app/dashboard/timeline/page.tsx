'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Loader2, 
  AlertCircle, 
  Filter, 
  ArrowLeft, 
  PlusCircle,
  Clock,
  CheckCircle2,
  Circle,
  CalendarIcon,
  Home
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isAfter, isBefore, addDays, isSameDay, compareAsc, compareDesc } from 'date-fns';
import { getAllTimelineEvents, TimelineEvent, TimelineEventType } from '@/lib/timelineApi';
import { getProperties } from '@/lib/api';
import CalendarExport from '@/components/CalendarExport';

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all'); // all, upcoming, past
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [calendarButtonPosition, setCalendarButtonPosition] = useState({ top: 0, left: 0 });
  
  // Fetch properties for the filter dropdown
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const result = await getProperties();
        if (result && result.data) {
          setProperties(result.data);
          console.log(`Fetched ${result.data.length} properties for filter`);
        }
      } catch (err) {
        console.error('Error fetching properties for filter:', err);
      }
    };
    
    fetchProperties();
  }, []);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getAllTimelineEvents(90);
        console.log('Timeline events response:', result);
        
        // Handle both possible response formats
        let eventsData = [];
        if (Array.isArray(result)) {
          eventsData = result;
        } else if (result && typeof result === 'object') {
          eventsData = result.data || [];
        }
        
        console.log(`Received ${eventsData.length} total events from API`);
        
        // Log event types to help with debugging
        const eventTypes: Record<string, number> = {};
        eventsData.forEach((event: TimelineEvent) => {
          eventTypes[event.event_type] = (eventTypes[event.event_type] || 0) + 1;
        });
        console.log('Event types distribution:', eventTypes);
        
        setEvents(eventsData);
      } catch (err: any) {
        setError(err.message || 'Failed to load timeline events');
        console.error('Error loading timeline events:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);
  
  // Get event icon based on type
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
  
  const today = new Date();
  
  // Apply filters
  const filteredEvents = events.filter(event => {
    // Debug
    console.log(`Filtering event: ${event.title}, type: ${event.event_type}, date: ${event.start_date}, is_completed: ${event.is_completed}`);
    
    // Status filter
    if (filter === 'upcoming') {
      // Show only future events that aren't completed
      const eventDate = parseISO(event.start_date);
      if (event.is_completed || (isBefore(eventDate, today) && !isSameDay(eventDate, today))) {
        return false;
      }
    }
    if (filter === 'past') {
      // Show past events or completed events
      const eventDate = parseISO(event.start_date);
      if (!event.is_completed && (isAfter(eventDate, today) || isSameDay(eventDate, today))) {
        return false;
      }
    }
    // If filter is 'all', no filtering based on date/completion status
    
    // Type filter
    if (typeFilter !== 'all' && event.event_type !== typeFilter) {
      return false;
    }
    
    // Property filter
    if (propertyFilter !== 'all' && event.property_id !== propertyFilter) {
      return false;
    }
    
    return true;
  });
  
  console.log(`After filtering: ${filteredEvents.length} events remain (filter: ${filter}, typeFilter: ${typeFilter}, propertyFilter: ${propertyFilter})`);
  
  // Sort events by date and split into upcoming and past
  const upcomingEvents = filteredEvents
    .filter((event) => {
      const eventDate = parseISO(event.start_date);
      return isAfter(eventDate, today) || isSameDay(eventDate, today);
    })
    .sort((a, b) => compareAsc(parseISO(a.start_date), parseISO(b.start_date)));

  const pastEvents = filteredEvents
    .filter((event) => {
      const eventDate = parseISO(event.start_date);
      return isBefore(eventDate, today) && !isSameDay(eventDate, today);
    })
    .sort((a, b) => compareDesc(parseISO(a.start_date), parseISO(b.start_date)));

  // Handle add to calendar button click
  const handleAddToCalendar = (event: TimelineEvent, e: React.MouseEvent) => {
    // Get position of the button to position the dropdown near it
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setCalendarButtonPosition({
      top: buttonRect.bottom + window.scrollY,
      left: buttonRect.left + window.scrollX
    });
    
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

  // Prepare event for calendar export
  const prepareEventForExport = (event: TimelineEvent) => {
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
      // Use current date instead
      const now = new Date();
      const oneHourLater = new Date(now);
      oneHourLater.setHours(oneHourLater.getHours() + 1);
      
      return {
        title: event.title || 'Untitled Event',
        description: event.description || `${formatEventType(event.event_type)} for property ${event.property_name || ''}`,
        startDateTime: now.toISOString(),
        endDateTime: oneHourLater.toISOString(),
        location: event.property_name || ''
      };
    }
    
    if (isNaN(endDate.getTime())) {
      console.error('Invalid end date:', endDate);
      endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);
    }
    
    return {
      title: event.title || 'Untitled Event',
      description: event.description || `${formatEventType(event.event_type)} for property ${event.property_name || ''}`,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      location: event.property_name || ''
    };
  };
  
  return (
    <div>
      {/* Calendar Export Dropdown - appears when an event is selected */}
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
              eventData={prepareEventForExport(selectedEvent)} 
            />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 mr-2 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Timeline</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard" 
            className="rounded-md bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
          >
            <ArrowLeft className="inline-block w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="statusFilter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past & Completed</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Event Type
          </label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Types</option>
            <option value={TimelineEventType.RENT_DUE}>Rent Due</option>
            <option value={TimelineEventType.LEASE_START}>Lease Start</option>
            <option value={TimelineEventType.LEASE_END}>Lease End</option>
            <option value={TimelineEventType.INSPECTION}>Inspection</option>
            <option value={TimelineEventType.MAINTENANCE}>Maintenance</option>
            <option value={TimelineEventType.CUSTOM}>Custom</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="propertyFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Property
          </label>
          <select
            id="propertyFilter"
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Properties</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="ml-auto self-end">
          <span className="text-sm text-gray-500">
            {filteredEvents.length} events found
          </span>
        </div>
      </div>
      
      {/* Timeline Events */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or add events to your properties.
            </p>
          </div>
        ) : (
          <div className="px-4 py-5 sm:px-6">
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
                            {event.property_name && (
                              <p className="text-sm font-medium text-blue-600 mt-1">
                                {event.property_name}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {formatEventType(event.event_type)}
                              </span>
                            </div>
                            <div className="mt-2 flex space-x-2">
                              {event.property_id && (
                                <Link 
                                  href={`/dashboard/properties/${event.property_id}`}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  <Home className="h-3 w-3 mr-1" />
                                  View Property
                                </Link>
                              )}
                              <button 
                                onClick={(e) => handleAddToCalendar(event, e)}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Add to Calendar
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {event.is_completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
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
                            {event.property_name && (
                              <p className="text-sm font-medium text-blue-600 mt-1">
                                {event.property_name}
                              </p>
                            )}
                            {event.description && (
                              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {formatEventType(event.event_type)}
                              </span>
                            </div>
                            <div className="mt-2 flex space-x-2">
                              {event.property_id && (
                                <Link 
                                  href={`/dashboard/properties/${event.property_id}`}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  <Home className="h-3 w-3 mr-1" />
                                  View Property
                                </Link>
                              )}
                              <button 
                                onClick={(e) => handleAddToCalendar(event, e)}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                              >
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                Add to Calendar
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {event.is_completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300" />
                          )}
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
    </div>
  );
}

// Helper function to format event type labels
function formatEventType(type: string): string {
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
      return 'Custom';
    default:
      return type;
  }
} 