import { Router } from 'express';
import protectedRouter from './protected';
import uploadRouter from './upload';
import propertiesRouter from './properties';
import timelineRouter from './timeline';
import calendarRouter from './calendar';
import documentRouter from './document';
import propertyUsersRouter from './propertyUsers';
import usersRouter from './users';
import contractsRouter from './contracts';
import agreementsRouter from './agreements';
import depositRequestsRouter from './depositRequests';

// Initialize main router
const router = Router();

// Use the protected routes under the /protected path
router.use('/protected', protectedRouter);
router.use('/upload', uploadRouter);
router.use('/properties', propertiesRouter);
router.use('/timeline', timelineRouter);
router.use('/calendar', calendarRouter);
router.use('/documents', documentRouter);
router.use('/property-users', propertyUsersRouter);
router.use('/users', usersRouter);
router.use('/contracts', contractsRouter);
router.use('/agreements', agreementsRouter);
router.use('/deposit-requests', depositRequestsRouter);

export default router; 