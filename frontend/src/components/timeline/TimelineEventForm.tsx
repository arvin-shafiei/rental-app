import { useState } from 'react';
import { TimelineEventType, TimelineEventRecurrence } from '@/lib/timelineApi';

interface TimelineEventFormProps {
  editingEvent: any | null;
  initialValues: {
    title: string;
    description: string;
    event_type: TimelineEventType;
    start_date: string;
    is_all_day: boolean;
    recurrence_type: TimelineEventRecurrence;
    notification_days_before: number;
  };
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

export default function TimelineEventForm({
  editingEvent,
  initialValues,
  onSubmit,
  onCancel
}: TimelineEventFormProps) {
  const [formData, setFormData] = useState(initialValues);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-2xl max-w-md w-full">
      <h3 className="text-lg font-medium mb-4 text-gray-900">
        {editingEvent ? 'Edit Event' : 'Add New Event'}
      </h3>
      
      <form onSubmit={handleSubmitForm}>
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
              value={formData.title}
              onChange={handleChange}
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
              value={formData.description}
              onChange={handleChange}
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
              value={formData.event_type}
              onChange={handleChange}
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
              value={formData.start_date}
              onChange={handleChange}
            />
          </div>
          
          <div className="flex items-center">
            <input
              id="is_all_day"
              name="is_all_day"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={formData.is_all_day}
              onChange={handleChange}
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
              value={formData.recurrence_type}
              onChange={handleChange}
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
              value={formData.notification_days_before}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="mt-5 sm:mt-6 flex justify-end space-x-2">
          <button
            type="button"
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onCancel}
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
  );
} 