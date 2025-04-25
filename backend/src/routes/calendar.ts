import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';
import ical, { ICalCalendar, ICalEventData } from 'ical-generator';
import moment from 'moment';
import nodeIcal from 'node-ical';

// Initialize router
const router = Router();

// Create or update ICS file for a user
router.post('/ics', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    
    // Get event details from request body
    const { 
      title, 
      description, 
      startDateTime, 
      endDateTime,
      location 
    } = req.body;
    
    // Validate required fields
    if (!title || !startDateTime || !endDateTime) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: title, startDateTime, endDateTime'
      });
      return;
    }

    // ICS file path in storage
    const filePath = `${userId}/calendar.ics`;
    
    // Check if file already exists
    const { data: existingFile, error: fetchError } = await supabaseAdmin.storage
      .from('room-media')
      .download(filePath);
    
    let calendar: ICalCalendar;
    
    if (existingFile && !fetchError) {
      // Parse existing calendar
      try {
        const existingIcsContent = await existingFile.text();
        calendar = ical({ name: `Calendar for ${user.email}` });
        
        // Parse existing ICS content using node-ical
        const existingEvents = await nodeIcal.async.parseICS(existingIcsContent);
        
        // Add all existing events to the new calendar
        Object.values(existingEvents).forEach(event => {
          // Only process VEVENT objects (actual calendar events)
          if (event.type === 'VEVENT') {
            // Create event data from parsed event
            const eventData: ICalEventData = {
              start: event.start,
              end: event.end || moment(event.start).add(1, 'hour').toDate(), // Default 1 hour if no end time
              summary: event.summary,
              description: event.description || '',
              location: event.location || '',
              id: event.uid || `existing-event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              created: event.created || new Date()
            };
            
            // Add to our new calendar
            calendar.createEvent(eventData);
          }
        });
        
        console.log(`Added ${Object.keys(existingEvents).length} existing events to calendar`);
      } catch (error) {
        console.error('Error parsing existing ICS file:', error);
        // If parsing fails, create a new calendar
        calendar = ical({ name: `Calendar for ${user.email}` });
      }
    } else {
      // Create new calendar
      calendar = ical({ name: `Calendar for ${user.email}` });
    }
    
    // Add new event to calendar
    calendar.createEvent({
      start: moment(startDateTime).toDate(),
      end: moment(endDateTime).toDate(),
      summary: title,
      description: description || '',
      location: location || '',
      id: `event-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created: moment().toDate()
    });
    
    // Generate ICS content
    const icsContent = calendar.toString();
    
    // Upload to Supabase storage
    const { data, error } = await supabaseAdmin.storage
      .from('room-media')
      .upload(filePath, icsContent, {
        contentType: 'text/calendar',
        upsert: true // Overwrite if exists
      });
    
    if (error) {
      throw new Error(`Failed to upload ICS file: ${error.message}`);
    }
    
    // Create a signed URL that expires in 7 days (604800 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('room-media')
      .createSignedUrl(filePath, 604800, {
        download: true
      });
    
    if (signedUrlError || !signedUrlData) {
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message || 'Unknown error'}`);
    }
    
    res.status(200).json({
      success: true,
      message: 'Calendar event added successfully',
      data: {
        calendarUrl: signedUrlData.signedUrl
      }
    });
  } catch (error: any) {
    console.error('Error managing ICS file:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding event to calendar',
      error: error.message
    });
  }
});

// Get user's calendar URL
router.get('/ics', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user.id;
    
    // ICS file path in storage
    const filePath = `${userId}/calendar.ics`;
    
    // Check if file exists
    const { data, error } = await supabaseAdmin.storage
      .from('room-media')
      .download(filePath);
    
    if (error || !data) {
      res.status(404).json({
        success: false,
        message: 'Calendar not found. Add an event first.'
      });
      return;
    }
    
    // Create a signed URL that expires in 7 days (604800 seconds)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('room-media')
      .createSignedUrl(filePath, 604800, {
        download: true
      });
    
    if (signedUrlError || !signedUrlData) {
      throw new Error(`Failed to create signed URL: ${signedUrlError?.message || 'Unknown error'}`);
    }
    
    res.status(200).json({
      success: true,
      data: {
        calendarUrl: signedUrlData.signedUrl
      }
    });
  } catch (error: any) {
    console.error('Error fetching ICS file:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving calendar URL',
      error: error.message
    });
  }
});

export default router; 