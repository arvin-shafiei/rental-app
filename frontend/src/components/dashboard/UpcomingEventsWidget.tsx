'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getUpcomingTimelineEvents, TimelineEvent, TimelineEventType } from '@/lib/timelineApi';

export default function UpcomingEventsWidget() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getUpcomingTimelineEvents(30); // Next 30 days
        setEvents(result.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load upcoming events');
        console.error('Error loading upcoming events:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUpcomingEvents();
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
  
  // Sort events by date (closest first)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Upcoming Events
        </h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="p-4 text-sm text-red-600 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      ) : sortedEvents.length === 0 ? (
        <div className="py-8 px-4 text-center">
          <p className="text-sm text-gray-500">No upcoming events found.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {sortedEvents.slice(0, 5).map(event => (
            <Link 
              key={event.id}
              href={`/dashboard/properties/${event.property_id}`}
              className="block hover:bg-gray-50"
            >
              <div className="px-4 py-4 sm:px-6 flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-xl mr-3">{getEventIcon(event.event_type)}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(event.start_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            </Link>
          ))}
          
          {sortedEvents.length > 5 && (
            <div className="px-4 py-3 bg-gray-50 text-center">
              <Link
                href="/dashboard/timeline"
                className="text-sm text-blue-600 font-medium hover:text-blue-800"
              >
                View all {sortedEvents.length} events
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 