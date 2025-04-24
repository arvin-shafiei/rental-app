import express from 'express';
import { 
  createTimelineEvent, 
  updateTimelineEvent, 
  deleteTimelineEvent, 
  getPropertyTimelineEvents, 
  getUpcomingEvents,
  syncPropertyTimeline
} from '../controllers/timelineController';
import { authenticateUser } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all timeline routes
router.use(authenticateUser);

// Create a new timeline event
router.post('/events', createTimelineEvent);

// Update an existing timeline event
router.put('/events/:id', updateTimelineEvent);

// Delete a timeline event
router.delete('/events/:id', deleteTimelineEvent);

// Get timeline events for a specific property
router.get('/properties/:propertyId/events', getPropertyTimelineEvents);

// Get upcoming events across all properties
router.get('/upcoming', getUpcomingEvents);

// Sync timeline for a property (generate events from property data)
router.post('/properties/:propertyId/sync', syncPropertyTimeline);

export default router;
