import { Router } from 'express';
import authRouter from './auth';

// Initialize main router
const router = Router();

// Use the auth routes under the /auth path
router.use('/auth', authRouter);

export default router; 