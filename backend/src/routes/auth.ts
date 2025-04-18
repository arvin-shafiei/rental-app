import { Router } from 'express';
import { AuthController } from '../controllers/auth';

// Initialize router
const router = Router();

// Auth routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.getCurrentUser);

export default router; 