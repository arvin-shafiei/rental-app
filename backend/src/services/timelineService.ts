import { supabase, supabaseAdmin } from './supabase';
import { 
  TimelineEvent, 
  CreateTimelineEventDTO, 
  UpdateTimelineEventDTO, 
  TimelineEventType, 
  TimelineEventRecurrence,
  TimelineSyncOptions
} from '../types/timeline';
import { addMonths, format, addDays, parseISO } from 'date-fns';

/**
 * Service for managing timeline events for rental properties
 */
export class TimelineService {
  /**
   * Create a new timeline event
   */
  async createEvent(eventData: CreateTimelineEventDTO, userId: string): Promise<TimelineEvent | null> {
    const { data, error } = await supabaseAdmin
      .from('timeline_events')
      .insert({
        ...eventData,
        user_id: userId,
        is_all_day: eventData.is_all_day || false,
        recurrence_type: eventData.recurrence_type || TimelineEventRecurrence.NONE
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating timeline event:', error);
      return null;
    }

    return data as TimelineEvent;
  }

  /**
   * Update an existing timeline event
   */
  async updateEvent(eventData: UpdateTimelineEventDTO, userId: string): Promise<TimelineEvent | null> {
    const { id, ...updateData } = eventData;

    // First verify the user owns this event
    const { data: existingEvent } = await supabaseAdmin
      .from('timeline_events')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existingEvent || existingEvent.user_id !== userId) {
      console.error('User does not own this event or event does not exist');
      return null;
    }

    const { data, error } = await supabaseAdmin
      .from('timeline_events')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating timeline event:', error);
      return null;
    }

    return data as TimelineEvent;
  }

  /**
   * Delete a timeline event
   */
  async deleteEvent(eventId: string, userId: string): Promise<boolean> {
    // First verify the user owns this event
    const { data: existingEvent } = await supabaseAdmin
      .from('timeline_events')
      .select('user_id')
      .eq('id', eventId)
      .single();

    if (!existingEvent || existingEvent.user_id !== userId) {
      console.error('User does not own this event or event does not exist');
      return false;
    }

    const { error } = await supabaseAdmin
      .from('timeline_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting timeline event:', error);
      return false;
    }

    return true;
  }

  /**
   * Get timeline events for a specific property
   */
  async getEventsByProperty(propertyId: string, userId: string): Promise<TimelineEvent[]> {
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('property_id', propertyId)
      .eq('user_id', userId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching timeline events:', error);
      return [];
    }

    return data as TimelineEvent[];
  }

  /**
   * Get upcoming timeline events for a user across all properties
   */
  async getUpcomingEvents(userId: string, daysAhead: number = 30): Promise<TimelineEvent[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('user_id', userId)
      .lte('start_date', format(cutoffDate, 'yyyy-MM-dd'))
      .gte('start_date', format(new Date(), 'yyyy-MM-dd'))
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming timeline events:', error);
      return [];
    }

    return data as TimelineEvent[];
  }

  /**
   * Generate timeline events based on property data
   */
  async syncPropertyTimeline(propertyId: string, userId: string, options: TimelineSyncOptions = {}): Promise<boolean> {
    // First, get the property data
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .eq('user_id', userId)
      .single();

    if (propertyError || !property) {
      console.error('Error fetching property data:', propertyError);
      return false;
    }

    try {
      // Generate lease-related events if requested
      if (options.autoGenerateLeaseEvents !== false && property.lease_start_date && property.lease_end_date) {
        await this.generateLeaseEvents(property, userId);
      }

      // Generate rent due dates if requested
      if (options.autoGenerateRentDueDates !== false && property.lease_start_date && property.rent_amount) {
        await this.generateRentDueDates(property, userId);
      }

      return true;
    } catch (error) {
      console.error('Error syncing property timeline:', error);
      return false;
    }
  }

  /**
   * Generate lease start/end events
   */
  private async generateLeaseEvents(property: any, userId: string): Promise<void> {
    // Check if lease start event already exists
    const { data: existingStartEvent } = await supabase
      .from('timeline_events')
      .select('id')
      .eq('property_id', property.id)
      .eq('event_type', TimelineEventType.LEASE_START)
      .eq('start_date', property.lease_start_date)
      .single();

    // Create lease start event if it doesn't exist
    if (!existingStartEvent) {
      await this.createEvent({
        property_id: property.id,
        title: 'Lease Start Date',
        description: `The lease for ${property.name} begins today.`,
        event_type: TimelineEventType.LEASE_START,
        start_date: property.lease_start_date,
        is_all_day: true,
        notification_days_before: 7
      }, userId);
    }

    // Check if lease end event already exists
    const { data: existingEndEvent } = await supabase
      .from('timeline_events')
      .select('id')
      .eq('property_id', property.id)
      .eq('event_type', TimelineEventType.LEASE_END)
      .eq('start_date', property.lease_end_date)
      .single();

    // Create lease end event if it doesn't exist
    if (!existingEndEvent) {
      await this.createEvent({
        property_id: property.id,
        title: 'Lease End Date',
        description: `The lease for ${property.name} ends today.`,
        event_type: TimelineEventType.LEASE_END,
        start_date: property.lease_end_date,
        is_all_day: true,
        notification_days_before: 30 // Notify a month before
      }, userId);
    }
  }

  /**
   * Generate monthly rent due dates
   */
  private async generateRentDueDates(property: any, userId: string): Promise<void> {
    const leaseStart = parseISO(property.lease_start_date);
    const leaseEnd = property.lease_end_date ? parseISO(property.lease_end_date) : addMonths(leaseStart, 12);
    
    // Get the day of the month that rent is due (default to 1st if not specified)
    const rentDueDay = property.property_details?.rent_due_day || 1;
    
    // Calculate the first rent due date (adjust to the specified day of month)
    let currentDate = new Date(leaseStart.getFullYear(), leaseStart.getMonth(), rentDueDay);
    
    // If the lease starts after the rent due day, move to next month
    if (leaseStart.getDate() > rentDueDay) {
      currentDate = addMonths(currentDate, 1);
    }
    
    // Generate rent due events until the end of the lease
    while (currentDate <= leaseEnd) {
      const eventDate = format(currentDate, 'yyyy-MM-dd');
      
      // Check if this rent event already exists
      const { data: existingEvent } = await supabase
        .from('timeline_events')
        .select('id')
        .eq('property_id', property.id)
        .eq('event_type', TimelineEventType.RENT_DUE)
        .eq('start_date', eventDate)
        .single();
      
      // Create rent due event if it doesn't exist
      if (!existingEvent) {
        await this.createEvent({
          property_id: property.id,
          title: 'Rent Payment Due',
          description: `Monthly rent payment of ${property.rent_amount} is due today.`,
          event_type: TimelineEventType.RENT_DUE,
          start_date: eventDate,
          is_all_day: true,
          notification_days_before: 3,
          metadata: {
            amount: property.rent_amount,
            currency: property.property_details?.currency || 'GBP'
          }
        }, userId);
      }
      
      // Move to next month
      currentDate = addMonths(currentDate, 1);
    }
  }
}

export default new TimelineService();
