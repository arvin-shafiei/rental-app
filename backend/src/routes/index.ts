import { Router } from 'express';
import protectedRouter from './protected';
import uploadRouter from './upload';
import propertiesRouter from './properties';
import timelineRouter from './timeline';
import calendarRouter from './calendar';
import documentRouter from './document';

// Initialize main router
const router = Router();

// Use the protected routes under the /protected path
router.use('/protected', protectedRouter);
router.use('/upload', uploadRouter);
router.use('/properties', propertiesRouter);
router.use('/timeline', timelineRouter);
router.use('/calendar', calendarRouter);
router.use('/documents', documentRouter);

export default router; 