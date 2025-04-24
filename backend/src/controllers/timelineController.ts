import { Request, Response } from 'express';
import timelineService from '../services/timelineService';
import { CreateTimelineEventDTO, UpdateTimelineEventDTO } from '../types/timeline';

export const createTimelineEvent = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const eventData: CreateTimelineEventDTO = req.body;
  
  try {
    const event = await timelineService.createEvent(eventData, userId);
    if (!event) {
      return res.status(500).json({ error: 'Failed to create timeline event' });
    }
    return res.status(201).json(event);
  } catch (error) {
    console.error('Error creating timeline event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTimelineEvent = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const eventData: UpdateTimelineEventDTO = req.body;
  
  try {
    const event = await timelineService.updateEvent(eventData, userId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found or not authorized to update' });
    }
    return res.status(200).json(event);
  } catch (error) {
    console.error('Error updating timeline event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTimelineEvent = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const eventId = req.params.id;
  
  try {
    const success = await timelineService.deleteEvent(eventId, userId);
    if (!success) {
      return res.status(404).json({ error: 'Event not found or not authorized to delete' });
    }
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting timeline event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPropertyTimelineEvents = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const propertyId = req.params.propertyId;
  
  try {
    const events = await timelineService.getEventsByProperty(propertyId, userId);
    return res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching property timeline events:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUpcomingEvents = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const daysAhead = req.query.days ? parseInt(req.query.days as string) : 30;
  
  try {
    const events = await timelineService.getUpcomingEvents(userId, daysAhead);
    return res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const syncPropertyTimeline = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const propertyId = req.params.propertyId;
  const options = req.body.options || {};
  
  try {
    const success = await timelineService.syncPropertyTimeline(propertyId, userId, options);
    if (!success) {
      return res.status(500).json({ error: 'Failed to sync property timeline' });
    }
    
    // Get updated events to return
    const events = await timelineService.getEventsByProperty(propertyId, userId);
    return res.status(200).json(events);
  } catch (error) {
    console.error('Error syncing property timeline:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
