import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { DepositRequestController } from '../controllers/depositRequestController';

// Initialize router
const router = Router();

// Initialize controller
const depositRequestController = new DepositRequestController();

// Send a deposit request email
router.post(
  '/',
  authenticateUser,
  depositRequestController.sendDepositRequest.bind(depositRequestController)
);

// Get deposit request history
router.get(
  '/',
  authenticateUser,
  depositRequestController.getDepositRequests.bind(depositRequestController)
);

export default router; 