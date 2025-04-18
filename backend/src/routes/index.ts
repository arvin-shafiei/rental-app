import { Router } from 'express';
import authRouter from './auth';
import protectedRouter from './protected';

// Initialize main router
const router = Router();

// Use the auth routes under the /auth path
router.use('/auth', authRouter);

// Use the protected routes under the /protected path
router.use('/protected', protectedRouter);

export default router; 