import { Router } from 'express';
import protectedRouter from './protected';
import propertiesRouter from './properties';

// Initialize main router
const router = Router();

// Use the protected routes under the /protected path
router.use('/protected', protectedRouter);

// Use the properties routes under the /properties path
router.use('/properties', propertiesRouter);

export default router; 