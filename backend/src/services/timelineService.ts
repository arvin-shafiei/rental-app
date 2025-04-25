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
    // First check if the property exists and is accessible to this user
    // Use service role client to bypass RLS when checking property access
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select('id, user_id')
      .eq('id', propertyId)
      .maybeSingle();

    if (propertyError) {
      console.error('Error fetching property:', propertyError);
      return [];
    }
    
    if (!property) {
      console.error('Property not found or user has no access:', { propertyId, userId });
      return [];
    }
    
    // Verify this property belongs to the requested user
    if (property.user_id !== userId) {
      console.error('User does not have access to this property:', { propertyId, userId, ownerId: property.user_id });
      return [];
    }
    
    // Now fetch the timeline events with the authenticated user
    const { data, error } = await supabaseAdmin
      .from('timeline_events')
      .select('*')
      .eq('property_id', propertyId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching timeline events:', error);
      return [];
    }

    return data as TimelineEvent[];
  }

  /**
   * Get upcoming events that should trigger notifications
   */
  async getUpcomingEvents(userId: string, daysAhead: number = 30): Promise<TimelineEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    const todayStr = format(today, 'yyyy-MM-dd');
    
    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
    
    // First, get all upcoming events with property details
    const { data, error } = await supabaseAdmin
      .from('timeline_events')
      .select(`
        *,
        properties:property_id (
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .lte('start_date', format(cutoffDate, 'yyyy-MM-dd'))
      .gte('start_date', todayStr)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming timeline events:', error);
      return [];
    }

    console.log(`Found ${data.length} upcoming events for user ${userId}`);
    
    // Filter events based on notification_days_before
    const notifiableEvents = data.filter(event => {
      // If the event is already completed, don't show a notification
      if (event.is_completed) return false;
      
      // Parse event date
      const eventDate = parseISO(event.start_date);
      eventDate.setHours(0, 0, 0, 0);
      const eventDateStr = format(eventDate, 'yyyy-MM-dd');
      
      // Always include events happening today
      if (eventDateStr === todayStr) {
        console.log(`Including event ${event.id} (${event.title}) because it's happening today`);
        return true;
      }
      
      // If the event doesn't have notification_days_before set, don't show a notification
      if (!event.notification_days_before && event.notification_days_before !== 0) {
        return false;
      }
      
      // Calculate the notification date for this event
      const notificationDate = new Date(eventDate);
      notificationDate.setDate(notificationDate.getDate() - event.notification_days_before);
      notificationDate.setHours(0, 0, 0, 0);
      
      // Notification should appear if today is on or after the notification date
      // but before or on the actual event date
      const shouldNotify = today >= notificationDate && today <= eventDate;
      
      if (shouldNotify) {
        console.log(`Including event ${event.id} (${event.title}) with notification_days_before=${event.notification_days_before}`);
      }
      
      return shouldNotify;
    });

    console.log(`Filtered to ${notifiableEvents.length} notifiable events`);

    // Add property_name to each event for easier display
    const eventsWithPropertyNames = notifiableEvents.map(event => ({
      ...event,
      property_name: event.properties?.name
    }));

    return eventsWithPropertyNames as TimelineEvent[];
  }

  /**
   * Generate timeline events based on property data
   */
  async syncPropertyTimeline(propertyId: string, userId: string, options: TimelineSyncOptions = {}): Promise<boolean> {
    // First, get the property data using the service role client
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .maybeSingle();

    if (propertyError) {
      console.error('Error fetching property data:', propertyError);
      return false;
    }

    if (!property) {
      console.error('Property not found:', { propertyId, userId });
      return false;
    }
    
    // Verify this property belongs to the requested user
    if (property.user_id !== userId) {
      console.error('User does not have access to this property:', { propertyId, userId, ownerId: property.user_id });
      return false;
    }

    // Log debug information
    console.log('Successfully found property:', {
      propertyId: propertyId,
      userId: userId,
      propertyName: property.name
    });

    try {
      console.log('Syncing timeline for property:', propertyId);
      console.log('Property data:', JSON.stringify(property, null, 2));
      console.log('Sync options:', JSON.stringify(options, null, 2));
      
      // Add sync options to property object for use in generator methods
      const propertyWithOptions = {
        ...property,
        sync_options: options
      };
      
      // Generate lease-related events if requested
      if (options.autoGenerateLeaseEvents !== false && property.lease_start_date && property.lease_end_date) {
        console.log('Generating lease events with dates:', property.lease_start_date, property.lease_end_date);
        await this.generateLeaseEvents(propertyWithOptions, userId);
      } else {
        console.log('Skipping lease events generation:', {
          autoGenerateLeaseEvents: options.autoGenerateLeaseEvents,
          has_lease_start: !!property.lease_start_date,
          has_lease_end: !!property.lease_end_date
        });
      }

      // Generate rent due dates if requested
      if (options.autoGenerateRentDueDates !== false && property.lease_start_date && property.rent_amount) {
        console.log('Generating rent due dates with:', property.lease_start_date, property.rent_amount);
        await this.generateRentDueDates(propertyWithOptions, userId);
      } else {
        console.log('Skipping rent due dates generation:', {
          autoGenerateRentDueDates: options.autoGenerateRentDueDates,
          has_lease_start: !!property.lease_start_date,
          has_rent_amount: !!property.rent_amount
        });
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
    console.log('Generating lease events with data:', {
      property_id: property.id,
      lease_start: property.lease_start_date,
      lease_end: property.lease_end_date,
    });
    
    // Format dates if necessary
    const leaseStartDate = property.lease_start_date;
    const leaseEndDate = property.lease_end_date;
    
    // Check if lease start event already exists
    const { data: existingStartEvent, error: startEventError } = await supabaseAdmin
      .from('timeline_events')
      .select('id')
      .eq('property_id', property.id)
      .eq('event_type', TimelineEventType.LEASE_START)
      .eq('start_date', leaseStartDate)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows found
      
    if (startEventError) {
      console.error('Error checking for existing lease start event:', startEventError);
    }

    // Create lease start event if it doesn't exist
    if (!existingStartEvent) {
      console.log('Creating lease start event for property:', property.id);
      const result = await this.createEvent({
        property_id: property.id,
        title: 'Lease Start Date',
        description: `The lease for ${property.name} begins today.`,
        event_type: TimelineEventType.LEASE_START,
        start_date: leaseStartDate,
        is_all_day: true,
        notification_days_before: 7
      }, userId);
      
      console.log('Lease start event created:', result ? 'success' : 'failed');
    } else {
      console.log('Lease start event already exists');
    }

    // Check if lease end event already exists
    const { data: existingEndEvent, error: endEventError } = await supabaseAdmin
      .from('timeline_events')
      .select('id')
      .eq('property_id', property.id)
      .eq('event_type', TimelineEventType.LEASE_END)
      .eq('start_date', leaseEndDate)
      .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows found
      
    if (endEventError) {
      console.error('Error checking for existing lease end event:', endEventError);
    }

    // Create lease end event if it doesn't exist
    if (!existingEndEvent) {
      console.log('Creating lease end event for property:', property.id);
      const result = await this.createEvent({
        property_id: property.id,
        title: 'Lease End Date',
        description: `The lease for ${property.name} ends today.`,
        event_type: TimelineEventType.LEASE_END,
        start_date: leaseEndDate,
        is_all_day: true,
        notification_days_before: 30 // Notify a month before
      }, userId);
      
      console.log('Lease end event created:', result ? 'success' : 'failed');
    } else {
      console.log('Lease end event already exists');
    }
  }

  /**
   * Generate monthly rent due dates
   */
  private async generateRentDueDates(property: any, userId: string): Promise<void> {
    console.log('Generating rent due dates with data:', {
      property_id: property.id,
      lease_start: property.lease_start_date,
      rent_amount: property.rent_amount
    });
    
    // Ensure we have valid dates by parsing them correctly
    let leaseStart;
    try {
      // Check if lease_start_date is already a Date object
      if (property.lease_start_date instanceof Date) {
        leaseStart = property.lease_start_date;
      } else {
        // Parse the date string
        leaseStart = parseISO(property.lease_start_date);
        
        // Verify it's a valid date
        if (!leaseStart || isNaN(leaseStart.getTime())) {
          throw new Error('Invalid lease start date');
        }
      }
    } catch (error) {
      console.error('Error parsing lease start date:', error);
      console.error('Original value:', property.lease_start_date);
      return; // Exit the function if we can't process the date
    }
    
    // Set a default lease end date if not provided
    let leaseEnd;
    try {
      if (property.lease_end_date) {
        if (property.lease_end_date instanceof Date) {
          leaseEnd = property.lease_end_date;
        } else {
          leaseEnd = parseISO(property.lease_end_date);
          
          // Verify it's a valid date
          if (!leaseEnd || isNaN(leaseEnd.getTime())) {
            throw new Error('Invalid lease end date');
          }
        }
      } else {
        // Default to 12 months after start date
        leaseEnd = addMonths(leaseStart, 12);
      }
    } catch (error) {
      console.error('Error parsing lease end date:', error);
      console.error('Original value:', property.lease_end_date);
      // Use default 12 months
      leaseEnd = addMonths(leaseStart, 12);
    }
    
    console.log('Parsed dates:', {
      leaseStart: leaseStart.toISOString(),
      leaseEnd: leaseEnd.toISOString()
    });
    
    // Get the day of the month that rent is due (default to 1st if not specified)
    // Make sure property_details is parsed properly from JSON
    interface PropertyDetails {
      rent_due_day?: number;
      currency?: string;
      [key: string]: any;
    }
    
    let propertyDetails: PropertyDetails = {};
    try {
      propertyDetails = typeof property.property_details === 'string' 
        ? JSON.parse(property.property_details) 
        : (property.property_details || {});
      console.log('Parsed property details:', propertyDetails);
    } catch (e) {
      console.log('Error parsing property_details:', e);
    }
    
    const rentDueDay = propertyDetails.rent_due_day || 1;
    console.log(`Rent due day is set to: ${rentDueDay}`);
    
    // Calculate the first rent due date (adjust to the specified day of month)
    let currentDate = new Date(leaseStart.getFullYear(), leaseStart.getMonth(), rentDueDay);
    
    // If the lease starts after the rent due day, move to next month
    if (leaseStart.getDate() > rentDueDay) {
      currentDate = addMonths(currentDate, 1);
      console.log(`Lease starts after the rent due day, moving to next month: ${format(currentDate, 'yyyy-MM-dd')}`);
    }
    
    // Check upfront rent paid from options
    const syncOptions = property.sync_options || {};
    const upfrontRentPaid = syncOptions.upfrontRentPaid || 0;
    
    console.log(`Upfront rent paid: ${upfrontRentPaid} months`);
    
    // Skip the months that have been paid upfront
    if (upfrontRentPaid > 0) {
      console.log(`Skipping ${upfrontRentPaid} months due to upfront payment`);
      currentDate = addMonths(currentDate, upfrontRentPaid);
    }
    
    console.log(`Generating rent due events from ${format(currentDate, 'yyyy-MM-dd')} to ${format(leaseEnd, 'yyyy-MM-dd')}`);
    
    // Count how many events we create
    let eventsCreated = 0;
    
    // Generate rent due events until the end of the lease
    while (currentDate <= leaseEnd) {
      // Format the date consistently
      const eventDate = format(currentDate, 'yyyy-MM-dd');
      
      // Check if this rent event already exists
      const { data: existingEvent, error: eventError } = await supabaseAdmin
        .from('timeline_events')
        .select('id')
        .eq('property_id', property.id)
        .eq('event_type', TimelineEventType.RENT_DUE)
        .eq('start_date', eventDate)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows found
        
      if (eventError) {
        console.error(`Error checking for existing rent event on ${eventDate}:`, eventError);
      }
      
      // Create rent due event if it doesn't exist
      if (!existingEvent) {
        console.log(`Creating rent due event for ${eventDate}`);
        
        // Format the currency display
        const currencySymbol = propertyDetails.currency === 'USD' ? '$' : 
                              propertyDetails.currency === 'EUR' ? '€' : '£';
        
        const result = await this.createEvent({
          property_id: property.id,
          title: 'Rent Payment Due',
          description: `Monthly rent payment of ${currencySymbol}${property.rent_amount} is due today.`,
          event_type: TimelineEventType.RENT_DUE,
          start_date: eventDate,
          is_all_day: true,
          notification_days_before: 3,
          metadata: {
            amount: property.rent_amount,
            currency: propertyDetails.currency || 'GBP'
          }
        }, userId);
        
        if (result) {
          eventsCreated++;
          console.log(`Rent due event created for ${eventDate}`);
        } else {
          console.error(`Failed to create rent due event for ${eventDate}`);
        }
      } else {
        console.log(`Rent due event already exists for ${eventDate}`);
      }
      
      // Move to next month
      currentDate = addMonths(currentDate, 1);
    }
    
    console.log(`Rent due date generation complete. Created ${eventsCreated} events.`);
  }
}

export default new TimelineService();
