'use client';

import { useState, useEffect } from 'react';
import { Calendar, Loader2, AlertCircle, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { getUpcomingTimelineEvents, TimelineEvent, TimelineEventType } from '@/lib/timelineApi';

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all'); // all, upcoming, past
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getUpcomingTimelineEvents(90); // Next 90 days
        setEvents(result.data || []);
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
        return '📝';
      case TimelineEventType.RENT_DUE:
        return '💰';
      case TimelineEventType.INSPECTION:
        return '🔍';
      case TimelineEventType.MAINTENANCE:
        return '🔧';
      default:
        return '📅';
    }
  };
  
  const today = new Date();
  
  // Apply filters
  const filteredEvents = events.filter(event => {
    // Status filter
    if (filter === 'upcoming' && (event.is_completed || isBefore(parseISO(event.start_date), today))) {
      return false;
    }
    if (filter === 'past' && (!event.is_completed && isAfter(parseISO(event.start_date), addDays(today, -1)))) {
      return false;
    }
    
    // Type filter
    if (typeFilter !== 'all' && event.event_type !== typeFilter) {
      return false;
    }
    
    return true;
  });
  
  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (filter === 'past') {
      return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
    }
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
  });
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 mr-2 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Timeline</h1>
        </div>
        <Link 
          href="/dashboard" 
          className="rounded-md bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-100"
        >
          <ArrowLeft className="inline-block w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
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
        
        <div className="ml-auto self-end">
          <span className="text-sm text-gray-500">
            {sortedEvents.length} events found
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
        ) : sortedEvents.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or add events to your properties.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedEvents.map(event => (
              <Link 
                key={event.id}
                href={`/dashboard/properties/${event.property_id}`}
                className="block hover:bg-gray-50"
              >
                <div className="px-6 py-4 flex items-start">
                  <span className="text-2xl mr-4 w-8 text-center">{getEventIcon(event.event_type)}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {format(parseISO(event.start_date), 'MMM d, yyyy')}
                          {event.is_completed && ' • Completed'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(event.event_type)}`}>
                        {formatEventType(event.event_type)}
                      </span>
                    </div>
                    {event.description && (
                      <p className="mt-1 text-sm text-gray-600">{event.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
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

// Helper function to get event type color classes
function getEventTypeColor(type: string): string {
  switch (type) {
    case TimelineEventType.LEASE_START:
    case TimelineEventType.LEASE_END:
      return 'bg-blue-100 text-blue-800';
    case TimelineEventType.RENT_DUE:
      return 'bg-green-100 text-green-800';
    case TimelineEventType.INSPECTION:
      return 'bg-orange-100 text-orange-800';
    case TimelineEventType.MAINTENANCE:
      return 'bg-red-100 text-red-800';
    case TimelineEventType.CUSTOM:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 