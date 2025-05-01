import { TimelineEvent } from '@/lib/timelineApi';
import { parseISO } from 'date-fns';
import CalendarExport from '@/components/CalendarExport';

interface CalendarExportDropdownProps {
  event: TimelineEvent | null;
  position: { top: number; left: number };
  onClose: () => void;
  propertyName: string;
}

export default function CalendarExportDropdown({
  event,
  position,
  onClose,
  propertyName
}: CalendarExportDropdownProps) {
  if (!event) return null;

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
        description: event.description || `${event.event_type} for property ${propertyName}`,
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
      description: event.description || `${event.event_type} for property ${propertyName}`,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      location: propertyName
    };
    
    console.log('Prepared calendar event:', calendarEvent);
    return calendarEvent;
  };

  return (
    <div 
      className="calendar-export-dropdown absolute z-50 bg-white rounded-lg shadow-xl p-4 border border-gray-200"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
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
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ✕
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          {event.title}
        </p>
        <CalendarExport 
          eventData={prepareEventForCalendar(event)} 
        />
      </div>
    </div>
  );
} 