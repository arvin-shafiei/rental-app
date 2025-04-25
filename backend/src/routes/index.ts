import { Router } from 'express';
import protectedRouter from './protected';
import uploadRouter from './upload';
import propertiesRouter from './properties';
import timelineRouter from './timeline';
import calendarRouter from './calendar';

// Initialize main router
const router = Router();

// Use the protected routes under the /protected path
router.use('/protected', protectedRouter);
router.use('/upload', uploadRouter);
router.use('/properties', propertiesRouter);
router.use('/timeline', timelineRouter);
router.use('/calendar', calendarRouter);

export default router; 