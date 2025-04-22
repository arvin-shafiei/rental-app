import { Router } from 'express';
import protectedRouter from './protected';

// Initialize main router
const router = Router();

// Use the protected routes under the /protected path
router.use('/protected', protectedRouter);

export default router; 