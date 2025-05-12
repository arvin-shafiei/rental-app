import { supabaseAdmin } from '../supabase';
import { TimelineEventType, TimelineEventRecurrence } from '../../types/timeline';
import { addMonths, format, parseISO } from 'date-fns';

/**
 * Generate lease start/end events
 */
export async function generateLeaseEvents(property: any, userId: string, timelineService: any): Promise<void> {
  console.log('Generating lease events with data:', {
    property_id: property.id,
    lease_start: property.lease_start_date,
    lease_end: property.lease_end_date,
  });
  
  // Format dates if necessary
  const leaseStartDate = property.lease_start_date;
  const leaseEndDate = property.lease_end_date;
  
  // Check if lease start date is in the past
  const now = new Date();
  const startDate = new Date(leaseStartDate);
  const isPastStartDate = startDate < now;
  
  // Check if lease start event already exists for this user
  const { data: existingStartEvent, error: startEventError } = await supabaseAdmin
    .from('timeline_events')
    .select('id')
    .eq('property_id', property.id)
    .eq('event_type', TimelineEventType.LEASE_START)
    .eq('start_date', leaseStartDate)
    .eq('user_id', userId) // Filter by user_id to allow multiple users to have their own events
    .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows found
    
  if (startEventError) {
    console.error('Error checking for existing lease start event:', startEventError);
  }

  // Create lease start event if it doesn't exist
  if (!existingStartEvent) {
    console.log('Creating lease start event for property:', property.id);
    const result = await timelineService.createEvent({
      property_id: property.id,
      title: 'Lease Start Date',
      description: `The lease for ${property.name} begins today.`,
      event_type: TimelineEventType.LEASE_START,
      start_date: leaseStartDate,
      is_all_day: true,
      notification_days_before: 7,
      is_completed: isPastStartDate // Mark as completed if start date is in the past
    }, userId);
    
    console.log('Lease start event created:', result ? 'success' : 'failed', isPastStartDate ? ' (marked as completed)' : '');
  } else {
    console.log('Lease start event already exists for this user');
  }

  // Check if lease end date is in the past
  const endDate = new Date(leaseEndDate);
  const isPastEndDate = endDate < now;

  // Check if lease end event already exists for this user
  const { data: existingEndEvent, error: endEventError } = await supabaseAdmin
    .from('timeline_events')
    .select('id')
    .eq('property_id', property.id)
    .eq('event_type', TimelineEventType.LEASE_END)
    .eq('start_date', leaseEndDate)
    .eq('user_id', userId) // Filter by user_id to allow multiple users to have their own events
    .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows found
    
  if (endEventError) {
    console.error('Error checking for existing lease end event:', endEventError);
  }

  // Create lease end event if it doesn't exist
  if (!existingEndEvent) {
    console.log('Creating lease end event for property:', property.id);
    const result = await timelineService.createEvent({
      property_id: property.id,
      title: 'Lease End Date',
      description: `The lease for ${property.name} ends today.`,
      event_type: TimelineEventType.LEASE_END,
      start_date: leaseEndDate,
      is_all_day: true,
      notification_days_before: 30, // Notify a month before
      is_completed: isPastEndDate // Mark as completed if end date is in the past
    }, userId);
    
    console.log('Lease end event created:', result ? 'success' : 'failed', isPastEndDate ? ' (marked as completed)' : '');
  } else {
    console.log('Lease end event already exists for this user');
  }
}

/**
 * Generate monthly rent due dates
 */
export async function generateRentDueDates(property: any, userId: string, timelineService: any): Promise<void> {
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
      .eq('user_id', userId) // Filter by user_id to allow multiple users to have their own events
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
      
      const result = await timelineService.createEvent({
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

/**
 * Generate inspection events
 */
export async function generateInspectionEvents(propertyData: any, userId: string, timelineService: any): Promise<boolean> {
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
    
    // Check if inspection event already exists
    const { data: existingEvent, error: checkError } = await supabaseAdmin
      .from('timeline_events')
      .select('id')
      .eq('property_id', propertyData.id)
      .eq('event_type', TimelineEventType.INSPECTION)
      .eq('user_id', userId)
      .eq('title', title)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing inspection event:', checkError);
    }
    
    // Only create if it doesn't already exist
    if (!existingEvent) {
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
    } else {
      console.log('Inspection event already exists for this user, skipping creation');
    }
    
    return true;
  } catch (error) {
    console.error('Error generating inspection events:', error);
    return false;
  }
}

/**
 * Generate maintenance reminders
 */
export async function generateMaintenanceReminders(propertyData: any, userId: string, timelineService: any): Promise<boolean> {
  try {
    const today = new Date();
    
    // Check if maintenance events already exist for this user and property
    const { data: existingEvents, error: checkError } = await supabaseAdmin
      .from('timeline_events')
      .select('id')
      .eq('property_id', propertyData.id)
      .eq('event_type', TimelineEventType.MAINTENANCE)
      .eq('user_id', userId)
      .eq('title', 'Quarterly Maintenance Check')
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing maintenance events:', checkError);
    }
    
    // Only create if they don't already exist
    if (!existingEvents) {
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
    } else {
      console.log('Maintenance events already exist for this user, skipping creation');
    }
    
    return true;
  } catch (error) {
    console.error('Error generating maintenance events:', error);
    return false;
  }
}

/**
 * Generate property tax events
 */
export async function generatePropertyTaxEvents(propertyData: any, userId: string, timelineService: any): Promise<boolean> {
  try {
    const today = new Date();
    const taxDueDate = new Date(today.getFullYear(), 3, 15); // April 15th of current year
    
    // If tax date has passed for this year, set it for next year
    if (today > taxDueDate) {
      taxDueDate.setFullYear(today.getFullYear() + 1);
    }
    
    // Check if tax event already exists for this user and property
    const { data: existingEvent, error: checkError } = await supabaseAdmin
      .from('timeline_events')
      .select('id')
      .eq('property_id', propertyData.id)
      .eq('user_id', userId)
      .eq('title', 'Property Tax Due')
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing property tax event:', checkError);
    }
    
    // Only create if it doesn't already exist
    if (!existingEvent) {
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
    } else {
      console.log('Property tax event already exists for this user, skipping creation');
    }
    
    return true;
  } catch (error) {
    console.error('Error generating property tax event:', error);
    return false;
  }
}

/**
 * Generate insurance events
 */
export async function generateInsuranceEvents(propertyData: any, userId: string, timelineService: any): Promise<boolean> {
  try {
    const today = new Date();
    const renewalDate = new Date();
    renewalDate.setFullYear(today.getFullYear() + 1);
    
    // Check if insurance event already exists for this user and property
    const { data: existingEvent, error: checkError } = await supabaseAdmin
      .from('timeline_events')
      .select('id')
      .eq('property_id', propertyData.id)
      .eq('user_id', userId)
      .eq('title', 'Insurance Renewal')
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking for existing insurance event:', checkError);
    }
    
    // Only create if it doesn't already exist
    if (!existingEvent) {
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
    } else {
      console.log('Insurance event already exists for this user, skipping creation');
    }
    
    return true;
  } catch (error) {
    console.error('Error generating insurance event:', error);
    return false;
  }
} 