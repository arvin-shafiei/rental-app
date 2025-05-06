import React from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar, Home, CheckCircle2, Circle, CalendarIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { TimelineEvent, TimelineEventType } from '@/lib/timelineApi';

interface TimelineEventCardProps {
  event: TimelineEvent;
  onAddToCalendar: (event: TimelineEvent, e: React.MouseEvent) => void;
  onToggleComplete?: (event: TimelineEvent) => void;
  isPast?: boolean;
  isUpdating?: boolean;
}

export function TimelineEventCard({ 
  event, 
  onAddToCalendar, 
  onToggleComplete,
  isPast = false,
  isUpdating = false
}: TimelineEventCardProps) {
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
        return <Calendar className="h-5 w-5 text-red-600" />;
      default:
        return <Calendar className="h-5 w-5 text-gray-600" />;
    }
  };

  // Helper function to format event type labels
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
      case TimelineEventType.OTHER:
        return 'Other';
      default:
        return type;
    }
  };

  // Handle toggle completion
  const handleToggleComplete = () => {
    if (onToggleComplete && !isUpdating) {
      onToggleComplete(event);
    }
  };

  // Render the completion button based on state
  const renderCompletionButton = () => {
    if (isUpdating) {
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    } else if (event.is_completed) {
      return <CheckCircle2 className="h-5 w-5 text-green-500 hover:text-green-600 transition-colors" />;
    } else {
      return <Circle className="h-5 w-5 text-gray-300 hover:text-gray-400 transition-colors" />;
    }
  };

  // Determine if we should show the completion toggle button
  // Hide it for Agreement type events
  const showCompletionToggle = event.event_type.toLowerCase() !== 'agreement';

  return (
    <div 
      className={`${
        isPast ? 'bg-gray-50' : 'bg-white'
      } border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow transition-shadow h-full flex flex-col relative`}
    >
      {/* Completion toggle button - positioned absolutely in the top right */}
      {showCompletionToggle && (
        <button 
          onClick={handleToggleComplete}
          className={`absolute top-4 right-4 focus:outline-none ${isUpdating ? 'cursor-wait' : 'cursor-pointer'}`}
          aria-label={event.is_completed ? "Mark as incomplete" : "Mark as complete"}
          disabled={isUpdating}
        >
          {renderCompletionButton()}
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className="mt-1">{getEventIcon(event.event_type)}</div>
        <div className={`flex-1 ${showCompletionToggle ? 'pr-8' : ''}`}>
          <div className="flex items-center">
            <h5 className="text-md font-medium text-gray-900 line-clamp-1">{event.title}</h5>
          </div>
          <p className="text-sm text-gray-500">
            {format(parseISO(event.start_date), 'MMM d, yyyy')}
            {event.is_all_day ? '' : ` at ${format(parseISO(event.start_date), 'h:mm a')}`}
          </p>
          {event.property_name && (
            <p className="text-sm font-medium text-blue-600 mt-1 line-clamp-1">
              {event.property_name}
            </p>
          )}
          {event.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
          )}
        </div>
      </div>
      
      <div className="mt-auto pt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {formatEventType(event.event_type)}
          </span>
        </div>
        <div className="flex space-x-2 text-xs">
          {event.property_id && (
            <Link 
              href={`/dashboard/properties/${event.property_id}`}
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              <Home className="h-3 w-3 mr-1" />
              View Property
            </Link>
          )}
          <button 
            onClick={(e) => onAddToCalendar(event, e)}
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            Add to Calendar
          </button>
        </div>
      </div>
    </div>
  );
} 