import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { RepairRequestController } from '../controllers/repairRequestController';

// Initialize router
const router = Router();

// Initialize controller
const repairRequestController = new RepairRequestController();

// Send a repair request email
router.post(
  '/',
  authenticateUser,
  repairRequestController.sendRepairRequest.bind(repairRequestController)
);

// Get repair request history
router.get(
  '/',
  authenticateUser,
  repairRequestController.getRepairRequests.bind(repairRequestController)
);

export default router; 