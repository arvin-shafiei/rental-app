'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  Loader2, 
  AlertCircle, 
  ArrowLeft, 
  CalendarIcon,
} from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isAfter, isBefore, isSameDay, compareAsc, compareDesc } from 'date-fns';
import { getAllTimelineEvents, TimelineEvent, TimelineEventType, updateTimelineEvent } from '@/lib/timelineApi';
import { getProperties } from '@/lib/api';
import CalendarExport from '@/components/CalendarExport';
import { Button } from '@/components/ui/button';
import TabButton from '@/components/ui/TabButton';
import { SearchInput } from '@/components/ui/search-input';
import { TimelineEventCard } from '@/components/ui/timeline-event-card';
import { InfiniteScroll } from '@/components/ui/infinite-scroll';

// Number of events to load per "page"
const ITEMS_PER_PAGE = 12;

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState<string>('upcoming'); // 'upcoming' or 'past'
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [calendarButtonPosition, setCalendarButtonPosition] = useState({ top: 0, left: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);
  
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
      
      setEvents(eventsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load timeline events');
      console.error('Error loading timeline events:', err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEvents();
  }, []);

  // Reset visible items when filters change
  useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [statusTab, typeFilter, propertyFilter, searchQuery]);
  
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

  // Handle toggle event completion - with API call
  const handleToggleComplete = async (eventToToggle: TimelineEvent) => {
    try {
      // Set updating state for immediate UI feedback
      setUpdatingEventId(eventToToggle.id);
      setError(null);
      
      // Optimistically update UI first for a smoother experience
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventToToggle.id 
            ? { ...event, is_completed: !event.is_completed }
            : event
        )
      );
      
      // Make the API call
      await updateTimelineEvent(eventToToggle.id, {
        is_completed: !eventToToggle.is_completed
      });
      
      // Refresh the events list to ensure consistency with server
      await fetchEvents();
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
      console.error('Error updating event completion status:', err);
      
      // Revert optimistic update on error
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventToToggle.id 
            ? { ...event, is_completed: eventToToggle.is_completed }
            : event
        )
      );
    } finally {
      setUpdatingEventId(null);
    }
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
        description: event.description || '',
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
      description: event.description || '',
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      location: event.property_name || ''
    };
  };

  // Search and filter events
  const filteredEvents = useMemo(() => {
    const today = new Date();
    
    return events.filter(event => {
      const eventDate = parseISO(event.start_date);
      
      // Status filter
      if (statusTab === 'upcoming') {
        // Show only future events that aren't completed
        if (event.is_completed || (isBefore(eventDate, today) && !isSameDay(eventDate, today))) {
          return false;
        }
      }
      if (statusTab === 'past') {
        // Show past events or completed events
        if (!event.is_completed && (isAfter(eventDate, today) || isSameDay(eventDate, today))) {
          return false;
        }
      }
      
      // Type filter
      if (typeFilter !== 'all' && event.event_type !== typeFilter) {
        return false;
      }
      
      // Property filter
      if (propertyFilter !== 'all' && event.property_id !== propertyFilter) {
        return false;
      }
      
      // Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          (event.title && event.title.toLowerCase().includes(query)) ||
          (event.description && event.description.toLowerCase().includes(query)) ||
          (event.property_name && event.property_name.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  }, [events, statusTab, typeFilter, propertyFilter, searchQuery]);
  
  // Sort events
  const sortedEvents = useMemo(() => {
    const today = new Date();
    
    if (statusTab === 'upcoming') {
      return filteredEvents.sort((a, b) => 
        compareAsc(parseISO(a.start_date), parseISO(b.start_date))
      );
    } else {
      return filteredEvents.sort((a, b) => 
        compareDesc(parseISO(a.start_date), parseISO(b.start_date))
      );
    }
  }, [filteredEvents, statusTab]);
  
  // Handle loading more items
  const loadMoreItems = () => {
    setVisibleItems(prev => prev + ITEMS_PER_PAGE);
  };
  
  // Calculate current visible events
  const visibleEvents = sortedEvents.slice(0, visibleItems);
  
  return (
    <div className="space-y-6">
      {/* Calendar Export Dropdown - appears when an event is selected */}
      {selectedEvent && (
        <div 
          className="calendar-export-dropdown fixed z-50 bg-white rounded-lg shadow-xl p-4 border border-gray-200"
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

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 mr-2 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Timeline</h1>
        </div>
        <div>
          <Link 
            href="/dashboard" 
            className="rounded-md bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
          >
            <ArrowLeft className="inline-block w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-white p-5 rounded-lg shadow">
        {/* Status tabs */}
        <div className="flex border-b border-gray-200 mb-5">
          <TabButton 
            active={statusTab === 'upcoming'} 
            onClick={() => setStatusTab('upcoming')}
          >
            Upcoming Events
          </TabButton>
          <TabButton 
            active={statusTab === 'past'} 
            onClick={() => setStatusTab('past')}
          >
            Past & Completed
          </TabButton>
        </div>
        
        {/* Search and filters in one row */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <SearchInput 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className="w-full sm:w-1/3 lg:w-2/5 mt-1.5"
          />
          
          <div className="flex flex-1 space-x-4">
            <div className="w-1/2">
              <label htmlFor="typeFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Types</option>
                <option value={TimelineEventType.RENT_DUE}>Rent Due</option>
                <option value={TimelineEventType.LEASE_START}>Lease Start</option>
                <option value={TimelineEventType.LEASE_END}>Lease End</option>
                <option value={TimelineEventType.INSPECTION}>Inspection</option>
                <option value={TimelineEventType.MAINTENANCE}>Maintenance</option>
                <option value={TimelineEventType.OTHER}>Other</option>
              </select>
            </div>
            
            <div className="w-1/2">
              <label htmlFor="propertyFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Property
              </label>
              <select
                id="propertyFilter"
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Properties</option>
                {properties.map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {filteredEvents.length} events found
          </span>
          {error && (
            <div className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Timeline Events Grid */}
      <div className="bg-white shadow rounded-lg overflow-hidden p-5">
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
          <InfiniteScroll
            hasMore={visibleEvents.length < filteredEvents.length}
            loadMore={loadMoreItems}
            loading={loading}
            loadingComponent={
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            }
            endMessage={
              <div className="text-center py-4 text-sm text-gray-500">
                No more events to load
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleEvents.map((event) => (
                <TimelineEventCard
                  key={event.id}
                  event={event}
                  onAddToCalendar={handleAddToCalendar}
                  onToggleComplete={handleToggleComplete}
                  isPast={statusTab === 'past'}
                  isUpdating={updatingEventId === event.id}
                />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </div>
  );
} 