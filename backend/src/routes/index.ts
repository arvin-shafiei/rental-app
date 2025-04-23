import { Router } from 'express';
import protectedRouter from './protected';
import uploadRouter from './upload';
import propertiesRouter from './properties';

// Initialize main router
const router = Router();

// Use the protected routes under the /protected path
router.use('/protected', protectedRouter);

export default router; 