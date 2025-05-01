import { format, parseISO } from 'date-fns';
import { 
  Calendar, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Circle,
  Home,
  CalendarIcon,
  AlertCircle
} from 'lucide-react';
import { TimelineEvent, TimelineEventType } from '@/lib/timelineApi';

interface TimelineEventCardProps {
  event: TimelineEvent;
  isPast?: boolean;
  onEdit: (event: TimelineEvent) => void;
  onDelete: (eventId: string) => void;
  onToggleComplete: (event: TimelineEvent) => void;
  onAddToCalendar: (event: TimelineEvent, e: React.MouseEvent) => void;
  propertyName: string;
}

export default function TimelineEventCard({
  event,
  isPast = false,
  onEdit,
  onDelete,
  onToggleComplete,
  onAddToCalendar,
  propertyName
}: TimelineEventCardProps) {
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
        return <Calendar className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className={`${isPast ? 'bg-gray-50' : 'bg-white'} border border-gray-200 rounded-lg p-4 shadow-sm ${!isPast && 'hover:shadow'}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          <div className="mt-1">{getEventIcon(event.event_type)}</div>
          <div>
            <div className="flex items-center">
              <h5 className={`text-md font-medium ${isPast ? 'text-gray-800' : 'text-gray-900'}`}>{event.title}</h5>
            </div>
            <p className="text-sm text-gray-500">
              {format(parseISO(event.start_date), 'MMM d, yyyy')}
              {event.is_all_day ? '' : ` at ${format(parseISO(event.start_date), 'h:mm a')}`}
            </p>
            {event.description && (
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isPast ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {formatEventType(event.event_type)}
              </span>
              {event.recurrence_type !== 'none' && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isPast ? 'bg-gray-100 text-gray-800' : 'bg-purple-100 text-purple-800'
                }`}>
                  {event.recurrence_type}
                </span>
              )}
            </div>
            <div className="mt-2">
              <button 
                onClick={(e) => onAddToCalendar(event, e)}
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
            onClick={() => onToggleComplete(event)}
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
            onClick={() => onEdit(event)}
            className="text-gray-400 hover:text-blue-500 p-1"
            title="Edit event"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="text-gray-400 hover:text-red-500 p-1"
            title="Delete event"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 