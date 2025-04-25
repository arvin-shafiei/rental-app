"use client";

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { getUpcomingTimelineEvents, TimelineEvent } from '@/lib/timelineApi';
import { format, parseISO, differenceInDays } from 'date-fns';
import Link from 'next/link';

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className = '' }: NotificationBellProps) {
  const [upcomingEvents, setUpcomingEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch upcoming events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        // Get notification-ready events
        const events = await getUpcomingTimelineEvents(30); // Extend to 30 days for notifications
        setUpcomingEvents(events);
      } catch (err) {
        console.error('Error fetching upcoming events:', err);
        setError('Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
    
    // Refresh events every 5 minutes
    const intervalId = setInterval(fetchEvents, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group events by date
  const groupedEvents = upcomingEvents.reduce((acc, event) => {
    const date = event.start_date.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  // Generate notification text based on days until event
  const getNotificationText = (event: TimelineEvent): string => {
    // Get today's date without time components
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = format(today, 'yyyy-MM-dd');
    
    // Parse event date without time components
    const eventDate = parseISO(event.start_date);
    const eventDateStr = format(eventDate, 'yyyy-MM-dd');
    
    // Check if the event is today
    if (eventDateStr === todayStr) {
      return "Today";
    }
    
    // Calculate days difference for future events
    const daysUntil = Math.round(
      (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysUntil === 1) {
      return "Tomorrow";
    } else if (daysUntil > 1) {
      return `In ${daysUntil} days`;
    } else {
      // If the event date is in the past
      return "Overdue";
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bell icon with notification count */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {upcomingEvents.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {upcomingEvents.length}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10 overflow-hidden">
          <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Loading...
              </div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-red-500">
                {error}
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No notifications
              </div>
            ) : (
              <div>
                {Object.keys(groupedEvents).map(date => (
                  <div key={date} className="border-b border-gray-100 last:border-b-0">
                    <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500">
                      {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                    </div>
                    <ul>
                      {groupedEvents[date].map((event: TimelineEvent) => {
                        const timeIndicator = getNotificationText(event);
                        const showTimeIndicator = timeIndicator === "Today" || 
                                               timeIndicator === "Tomorrow" ||
                                               timeIndicator === "Overdue" ||
                                               timeIndicator.startsWith("In ");
                        
                        return (
                          <li key={event.id} className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {event.title}
                                  </p>
                                  {showTimeIndicator && (
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                                      timeIndicator === "Overdue" 
                                        ? "bg-red-100 text-red-800"
                                        : timeIndicator === "Today"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-yellow-100 text-yellow-800"
                                    }`}>
                                      {timeIndicator}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  {event.property_name || 'Property'}
                                </p>
                                {event.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {event.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-center">
            <Link 
              href="/dashboard/properties" 
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={() => setIsOpen(false)}
            >
              View all events
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 