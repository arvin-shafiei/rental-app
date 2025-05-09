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
      .select('*')
      .eq('id', id)
      .single();

    if (!existingEvent || existingEvent.user_id !== userId) {
      console.error('User does not own this event or event does not exist');
      return null;
    }

    // Update the timeline event
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

    // If this is an agreement task event and completion status has changed,
    // we need to update the agreement check item as well
    if (existingEvent.event_type === 'agreement_task' && 
        'is_completed' in updateData && 
        existingEvent.metadata && 
        existingEvent.metadata.agreement_id && 
        existingEvent.metadata.item_index !== undefined) {
      
      try {
        // Get the agreement
        const { data: agreement, error: agreementError } = await supabaseAdmin
          .from('agreements')
          .select('check_items')
          .eq('id', existingEvent.metadata.agreement_id)
          .single();
        
        if (agreementError || !agreement) {
          console.error('Error fetching agreement:', agreementError);
        } else {
          // Update the check item's checked status
          const checkItems = agreement.check_items;
          const itemIndex = existingEvent.metadata.item_index;
          
          if (Array.isArray(checkItems) && itemIndex < checkItems.length) {
            // Create a deep copy of the check items array
            const updatedCheckItems = JSON.parse(JSON.stringify(checkItems));
            
            // Update the specific item
            updatedCheckItems[itemIndex].checked = !!updateData.is_completed;
            
            // If completed, add completed_by and completed_at
            if (updateData.is_completed) {
              updatedCheckItems[itemIndex].completed_by = userId;
              updatedCheckItems[itemIndex].completed_at = new Date().toISOString();
            } else {
              // If uncompleted, remove these fields
              delete updatedCheckItems[itemIndex].completed_by;
              delete updatedCheckItems[itemIndex].completed_at;
            }
            
            // Update the agreement
            const { error: updateError } = await supabaseAdmin
              .from('agreements')
              .update({ check_items: updatedCheckItems })
              .eq('id', existingEvent.metadata.agreement_id);
            
            if (updateError) {
              console.error('Error updating agreement check item:', updateError);
            } else {
              console.log(`Successfully updated agreement ${existingEvent.metadata.agreement_id} check item ${itemIndex}`);
            }
          }
        }
      } catch (err) {
        console.error('Error syncing agreement check item completion status:', err);
      }
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
    try {
      console.log(`Fetching timeline events for property ${propertyId} and user ${userId}`);
      
      // First check if the user has access to this property
      const { data: propertyAccess, error: accessError } = await supabaseAdmin
        .from('property_users')
        .select('id')
        .eq('property_id', propertyId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (accessError) {
        console.error('Error checking property access:', accessError);
        return [];
      }
      
      if (!propertyAccess) {
        console.error('User does not have access to this property:', { propertyId, userId });
        return [];
      }
      
      // Use our custom database function to get shared property events
      // This function handles showing all property events to all users,
      // but only shows one instance of Agreement events per user
      const { data, error } = await supabaseAdmin
        .rpc('get_property_timeline_events', {
          p_property_id: propertyId,
          p_user_id: userId
        });
      
      if (error) {
        console.error('Error fetching timeline events:', error);
        return [];
      }
      
      console.log(`Retrieved ${data?.length || 0} timeline events for property ${propertyId}`);
      return data as TimelineEvent[];
    } catch (error) {
      console.error('Exception in getEventsByProperty:', error);
      return [];
    }
  }

  /**
   * Get all timeline events for a user across all properties
   * Unlike getUpcomingEvents, this doesn't filter based on notification settings
   */
  async getAllUserEvents(userId: string, daysRange: number = 90): Promise<TimelineEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`Fetching ALL timeline events for user ${userId} without date restrictions`);
    
    // Get all events for properties the user has access to
    const { data: accessibleProperties, error: propertiesError } = await supabaseAdmin
      .from('property_users')
      .select('property_id')
      .eq('user_id', userId);
    
    if (propertiesError) {
      console.error('Error fetching accessible properties:', propertiesError);
      return [];
    }
    
    // Extract property IDs
    const propertyIds = accessibleProperties.map(p => p.property_id);
    console.log(`User has access to ${propertyIds.length} properties`);
    
    // Query timeline events - without date restrictions
    const { data, error } = await supabaseAdmin
      .from('timeline_events')
      .select(`
        *,
        properties:property_id (
          id,
          name
        )
      `)
      .in('property_id', propertyIds.length > 0 ? propertyIds : ['no-properties'])
      .eq('user_id', userId) // Only show events created by this user
      .order('start_date', { ascending: true });
    
    if (error) {
      console.error('Error fetching all user timeline events:', error);
      return [];
    }
    
    console.log(`Retrieved ${data?.length || 0} total timeline events for user ${userId}`);
    
    // No need to filter by event type anymore since we're already filtering by user_id in the query
    console.log(`Returning ${data.length} events that belong to user ${userId}`);
    
    // Add property_name to each event for easier display
    const eventsWithPropertyNames = data.map(event => ({
      ...event,
      property_name: event.properties?.name
    }));
    
    return eventsWithPropertyNames as TimelineEvent[];
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
    
    // For upcoming events, we already filter by user_id in the query above,
    // so there's no need to filter agreement_task events here.
    // This ensures users only see their own upcoming tasks.
    
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
    // First check if the user has access to this property via the property_users table
    const { data: propertyAccess, error: accessError } = await supabaseAdmin
      .from('property_users')
      .select('id, user_role')
      .eq('property_id', propertyId)
      .eq('user_id', userId)
      .maybeSingle();
    
    if (accessError) {
      console.error('Error checking property access:', accessError);
      return false;
    }
    
    if (!propertyAccess) {
      console.error('User does not have access to this property:', { propertyId, userId });
      return false;
    }

    // Get the property data using the service role client
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
    
    // We no longer need to verify property ownership here, as we checked access through property_users
    
    // Log debug information
    console.log('Successfully found property:', {
      propertyId: propertyId,
      userId: userId,
      propertyName: property.name,
      userRole: propertyAccess.user_role
    });

    try {
      // Handle the clear all events flag first if present
      if (options.clearAllEvents) {
        console.log('Clearing all events for property:', propertyId);
        
        // Delete all timeline events for this property
        const { error } = await supabaseAdmin
          .from('timeline_events')
          .delete()
          .eq('property_id', propertyId);
        
        if (error) {
          console.error('Error clearing timeline events:', error);
          return false;
        }
        
        console.log('Successfully cleared all events for property:', propertyId);
        return true;
      }
      
      console.log('Syncing timeline for property:', propertyId);
      console.log('Property data:', JSON.stringify(property, null, 2));
      console.log('Sync options:', JSON.stringify(options, null, 2));
      
      // If a startDate is provided, temporarily override the property dates for event generation
      if (options.startDate) {
        console.log(`Using provided start date: ${options.startDate} instead of property default dates`);
        
        // Save original dates
        const originalStartDate = property.lease_start_date;
        
        // Set the new date for event generation
        property.lease_start_date = options.startDate;
        
        // If there's a lease_end_date and it's after the original start, adjust it relative to new start
        if (property.lease_end_date) {
          try {
            const originalStart = new Date(originalStartDate);
            const originalEnd = new Date(property.lease_end_date);
            const newStart = new Date(options.startDate);
            
            if (!isNaN(originalStart.getTime()) && !isNaN(originalEnd.getTime()) && !isNaN(newStart.getTime())) {
              // Calculate duration in milliseconds
              const durationMs = originalEnd.getTime() - originalStart.getTime();
              
              // Add duration to new start date
              const newEnd = new Date(newStart.getTime() + durationMs);
              property.lease_end_date = newEnd.toISOString().split('T')[0];
              
              console.log(`Adjusted lease_end_date to: ${property.lease_end_date} based on new start date`);
            }
          } catch (e) {
            console.error('Error adjusting lease end date:', e);
            // If date adjustment fails, keep original end date
          }
        }
      }
      
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

      // Generate property inspections if requested
      if (options.includeInspections) {
        console.log('Generating property inspection events');
        await this.generateInspectionEvents(propertyWithOptions, userId);
      }

      // Generate maintenance reminders if requested
      if (options.includeMaintenanceReminders) {
        console.log('Generating maintenance reminder events');
        await this.generateMaintenanceReminders(propertyWithOptions, userId);
      }

      // Generate property tax events if requested
      if (options.includePropertyTaxes) {
        console.log('Generating property tax events');
        await this.generatePropertyTaxEvents(propertyWithOptions, userId);
      }

      // Generate insurance renewal events if requested
      if (options.includeInsurance) {
        console.log('Generating insurance renewal events');
        await this.generateInsuranceEvents(propertyWithOptions, userId);
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
    
    // Debug: Log the entire sync_options object
    console.log('DEBUG - Full sync_options:', JSON.stringify(property.sync_options, null, 2));
    
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
    
    // Get the sync options
    const syncOptions = property.sync_options || {};
    
    // Debug: Log syncOptions type and check for rentDueDay
    console.log('DEBUG - syncOptions type:', typeof syncOptions);
    console.log('DEBUG - syncOptions has rentDueDay?', 'rentDueDay' in syncOptions);
    console.log('DEBUG - rentDueDay value is:', syncOptions.rentDueDay);
    console.log('DEBUG - rentDueDay type is:', typeof syncOptions.rentDueDay);
    
    // Get the day of the month that rent is due (default to 1st if not specified)
    // First check if it's specified in sync options
    let rentDueDay: number;
    
    if (syncOptions.rentDueDay !== undefined) {
      rentDueDay = syncOptions.rentDueDay;
      console.log(`Using rent due day from sync options: ${rentDueDay}`);
    } else {
      // Fall back to property details if not in sync options
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
      
      rentDueDay = propertyDetails.rent_due_day || 1;
    }
    
    console.log(`Rent due day is set to: ${rentDueDay}`);
    
    // Calculate the first rent due date (adjust to the specified day of month)
    let currentDate = new Date(leaseStart.getFullYear(), leaseStart.getMonth(), rentDueDay);
    
    // If the lease starts after the rent due day, move to next month
    if (leaseStart.getDate() > rentDueDay) {
      currentDate = addMonths(currentDate, 1);
      console.log(`Lease starts after the rent due day, moving to next month: ${format(currentDate, 'yyyy-MM-dd')}`);
    }
    
    // Check upfront rent paid from options
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
        
        // Need to get currency info for display
        let currency = 'GBP';
        let propertyDetails: { currency?: string } = {};
        
        try {
          propertyDetails = typeof property.property_details === 'string' 
            ? JSON.parse(property.property_details) 
            : (property.property_details || {});
        } catch (e) {
          console.log('Error parsing property_details for currency:', e);
        }
        
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

  // Add these methods to generate the various event types
  private async generateInspectionEvents(propertyData: any, userId: string): Promise<boolean> {
    try {
      const today = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(today.getFullYear() + 1);
      
      // Get frequency from options or default to yearly
      const inspectionFrequency = propertyData.sync_options?.inspectionFrequency || 'annual';
      
      // Determine recurrence type based on frequency
      let recurrenceType;
      let title;
      
      switch (inspectionFrequency) {
        case 'quarterly':
          recurrenceType = TimelineEventRecurrence.QUARTERLY;
          title = 'Quarterly Property Inspection';
          break;
        case 'biannual':
          recurrenceType = TimelineEventRecurrence.NONE; // No direct biannual option
          title = 'Semi-Annual Property Inspection';
          break;
        case 'annual':
        default:
          recurrenceType = TimelineEventRecurrence.YEARLY;
          title = 'Annual Property Inspection';
          break;
      }
      
      // Create inspection event
      const inspectionEvent = {
        property_id: propertyData.id,
        user_id: userId,
        title: title,
        description: `Schedule an inspection for ${propertyData.name || 'your property'}`,
        event_type: TimelineEventType.INSPECTION,
        start_date: nextYear.toISOString(),
        is_all_day: true,
        recurrence_type: recurrenceType,
        notification_days_before: 14,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabaseAdmin
        .from('timeline_events')
        .insert(inspectionEvent);
      
      if (error) {
        console.error('Error creating inspection event:', error);
        return false;
      }
      
      // For biannual frequency, we need to create two events per year
      if (inspectionFrequency === 'biannual') {
        const secondInspection = new Date();
        secondInspection.setMonth(today.getMonth() + 6);
        
        const secondInspectionEvent = {
          ...inspectionEvent,
          start_date: secondInspection.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: secondError } = await supabaseAdmin
          .from('timeline_events')
          .insert(secondInspectionEvent);
        
        if (secondError) {
          console.error('Error creating second inspection event:', secondError);
          // Continue anyway, at least we created one event
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error generating inspection events:', error);
      return false;
    }
  }

  private async generateMaintenanceReminders(propertyData: any, userId: string): Promise<boolean> {
    try {
      const today = new Date();
      
      // Create quarterly maintenance events
      const maintenanceEvents = [];
      
      for (let i = 0; i < 4; i++) {
        const eventDate = new Date();
        eventDate.setMonth(today.getMonth() + 3 * (i + 1));
        
        maintenanceEvents.push({
          property_id: propertyData.id,
          user_id: userId,
          title: 'Quarterly Maintenance Check',
          description: `Schedule regular maintenance for ${propertyData.name || 'your property'}`,
          event_type: TimelineEventType.MAINTENANCE,
          start_date: eventDate.toISOString(),
          is_all_day: true,
          recurrence_type: TimelineEventRecurrence.QUARTERLY,
          notification_days_before: 7,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
      
      if (maintenanceEvents.length > 0) {
        const { error } = await supabaseAdmin
          .from('timeline_events')
          .insert(maintenanceEvents);
        
        if (error) {
          console.error('Error creating maintenance events:', error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error generating maintenance events:', error);
      return false;
    }
  }

  private async generatePropertyTaxEvents(propertyData: any, userId: string): Promise<boolean> {
    try {
      const today = new Date();
      const taxDueDate = new Date(today.getFullYear(), 3, 15); // April 15th of current year
      
      // If tax date has passed for this year, set it for next year
      if (today > taxDueDate) {
        taxDueDate.setFullYear(today.getFullYear() + 1);
      }
      
      const taxEvent = {
        property_id: propertyData.id,
        user_id: userId,
        title: 'Property Tax Due',
        description: `Property tax payment due for ${propertyData.name || 'your property'}`,
        event_type: TimelineEventType.OTHER,
        start_date: taxDueDate.toISOString(),
        is_all_day: true,
        recurrence_type: TimelineEventRecurrence.YEARLY,
        notification_days_before: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabaseAdmin
        .from('timeline_events')
        .insert(taxEvent);
      
      if (error) {
        console.error('Error creating property tax event:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error generating property tax event:', error);
      return false;
    }
  }

  private async generateInsuranceEvents(propertyData: any, userId: string): Promise<boolean> {
    try {
      const today = new Date();
      const renewalDate = new Date();
      renewalDate.setFullYear(today.getFullYear() + 1);
      
      const insuranceEvent = {
        property_id: propertyData.id,
        user_id: userId,
        title: 'Insurance Renewal',
        description: `Renew insurance for ${propertyData.name || 'your property'}`,
        event_type: TimelineEventType.OTHER,
        start_date: renewalDate.toISOString(),
        is_all_day: true,
        recurrence_type: TimelineEventRecurrence.YEARLY,
        notification_days_before: 30,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabaseAdmin
        .from('timeline_events')
        .insert(insuranceEvent);
      
      if (error) {
        console.error('Error creating insurance event:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error generating insurance event:', error);
      return false;
    }
  }
}

export default new TimelineService();
