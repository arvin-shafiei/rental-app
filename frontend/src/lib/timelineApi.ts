import { fetchFromApi } from './api';

export enum TimelineEventType {
  LEASE_START = 'lease_start',
  LEASE_END = 'lease_end',
  RENT_DUE = 'rent_due',
  INSPECTION = 'inspection',
  MAINTENANCE = 'maintenance',
  CUSTOM = 'custom'
}

export enum TimelineEventRecurrence {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export interface TimelineEvent {
  id: string;
  property_id: string;
  user_id: string;
  title: string;
  description?: string;
  event_type: TimelineEventType;
  start_date: string; // ISO date string
  end_date?: string; // ISO date string
  is_all_day: boolean;
  recurrence_type: TimelineEventRecurrence;
  recurrence_end_date?: string;
  notification_days_before?: number;
  is_completed?: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface CreateTimelineEventDTO {
  property_id: string;
  title: string;
  description?: string;
  event_type: TimelineEventType;
  start_date: string; // ISO date string
  end_date?: string; // ISO date string
  is_all_day?: boolean;
  recurrence_type?: TimelineEventRecurrence;
  recurrence_end_date?: string;
  notification_days_before?: number;
  metadata?: Record<string, any>;
}

export interface UpdateTimelineEventDTO extends Partial<CreateTimelineEventDTO> {
  id: string;
  is_completed?: boolean;
}

export interface TimelineSyncOptions {
  autoGenerateRentDueDates?: boolean;
  autoGenerateLeaseEvents?: boolean;
}

/**
 * Get timeline events for a specific property
 */
export const getPropertyTimelineEvents = async (propertyId: string) => {
  console.log(`Fetching timeline events for property: ${propertyId}`);
  try {
    const response = await fetchFromApi(`/timeline/properties/${propertyId}/events`);
    
    // Add detailed logging for troubleshooting
    console.log('API Response:', response);
    
    // Simply return the response data directly, assuming it's already an array
    return response;
  } catch (error) {
    console.error('Error fetching timeline events:', error);
    throw error;
  }
};

/**
 * Get upcoming timeline events for the user across all properties
 */
export const getUpcomingTimelineEvents = async (days?: number) => {
  const queryParams = days ? `?days=${days}` : '';
  return fetchFromApi(`/timeline/upcoming${queryParams}`);
};

/**
 * Create a new timeline event
 */
export const createTimelineEvent = async (eventData: CreateTimelineEventDTO) => {
  return fetchFromApi('/timeline/events', {
    method: 'POST',
    body: JSON.stringify(eventData)
  });
};

/**
 * Update an existing timeline event
 */
export const updateTimelineEvent = async (id: string, eventData: Partial<UpdateTimelineEventDTO>) => {
  return fetchFromApi(`/timeline/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(eventData)
  });
};

/**
 * Delete a timeline event
 */
export const deleteTimelineEvent = async (id: string) => {
  return fetchFromApi(`/timeline/events/${id}`, {
    method: 'DELETE'
  });
};

/**
 * Sync timeline events for a property (generate from property data)
 */
export const syncPropertyTimeline = async (propertyId: string, options?: TimelineSyncOptions) => {
  return fetchFromApi(`/timeline/properties/${propertyId}/sync`, {
    method: 'POST',
    body: JSON.stringify({ options })
  });
}; 