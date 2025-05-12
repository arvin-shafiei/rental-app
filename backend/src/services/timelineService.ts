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

// Import event generators from separate modules
import {
  generateLeaseEvents,
  generateRentDueDates,
  generateInspectionEvents,
  generateMaintenanceReminders,
  generatePropertyTaxEvents,
  generateInsuranceEvents
} from './timeline/eventGenerators';

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
      .select('user_id, event_type, metadata')
      .eq('id', eventId)
      .single();

    if (!existingEvent || existingEvent.user_id !== userId) {
      console.error('User does not own this event or event does not exist');
      return false;
    }

    // If this is an agreement task event, update the agreement to unassign the user
    if (existingEvent.event_type === 'agreement_task' && 
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
          // Update the check item to unassign the user
          const checkItems = agreement.check_items;
          const itemIndex = existingEvent.metadata.item_index;
          
          if (Array.isArray(checkItems) && itemIndex < checkItems.length) {
            // Create a deep copy of the check items array
            const updatedCheckItems = JSON.parse(JSON.stringify(checkItems));
            
            // Remove the assigned_to and event_id from the item
            updatedCheckItems[itemIndex].assigned_to = null;
            updatedCheckItems[itemIndex].event_id = null;
            
            // Update the agreement
            const { error: updateError } = await supabaseAdmin
              .from('agreements')
              .update({ check_items: updatedCheckItems })
              .eq('id', existingEvent.metadata.agreement_id);
            
            if (updateError) {
              console.error('Error updating agreement check item:', updateError);
            } else {
              console.log(`Successfully unassigned user from agreement ${existingEvent.metadata.agreement_id} check item ${itemIndex}`);
            }
          }
        }
      } catch (err) {
        console.error('Error syncing agreement check item assignment:', err);
        // Continue with deletion even if updating the agreement fails
      }
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
        await generateLeaseEvents(propertyWithOptions, userId, this);
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
        await generateRentDueDates(propertyWithOptions, userId, this);
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
        await generateInspectionEvents(propertyWithOptions, userId, this);
      }

      // Generate maintenance reminders if requested
      if (options.includeMaintenanceReminders) {
        console.log('Generating maintenance reminder events');
        await generateMaintenanceReminders(propertyWithOptions, userId, this);
      }

      // Generate property tax events if requested
      if (options.includePropertyTaxes) {
        console.log('Generating property tax events');
        await generatePropertyTaxEvents(propertyWithOptions, userId, this);
      }

      // Generate insurance renewal events if requested
      if (options.includeInsurance) {
        console.log('Generating insurance renewal events');
        await generateInsuranceEvents(propertyWithOptions, userId, this);
      }

      return true;
    } catch (error) {
      console.error('Error syncing property timeline:', error);
      return false;
    }
  }
}

export default new TimelineService();
