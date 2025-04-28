import { Router, Request } from 'express';
import { AgreementController } from '../controllers/agreementController';
import { authenticateUser } from '../middleware/auth';

// Extend the Request type for our custom properties
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
  propertyRole?: string;
}

// Initialize router
const router = Router();

// Initialize controller
const agreementController = new AgreementController();

// Apply auth middleware to all routes
router.use(authenticateUser);

// Detailed logging middleware for agreements routes
router.use((req, res, next) => {
  console.log(`[Agreements API] Processing ${req.method} ${req.path}`);
  next();
});

/**
 * Get all agreements
 * Optional query param: propertyId to filter by property
 */
router.get('/', agreementController.getAgreements.bind(agreementController));

/**
 * Get a specific agreement by ID
 */
router.get('/:id', agreementController.getAgreementById.bind(agreementController));

/**
 * Create a new agreement
 * Required fields in body: title, propertyId, checkItems
 */
router.post('/', agreementController.createAgreement.bind(agreementController));

/**
 * Update an agreement
 */
router.put('/:id', agreementController.updateAgreement.bind(agreementController));

/**
 * Update a specific task within an agreement
 * Required fields in body: taskIndex, action, userId (optional)
 */
router.put('/:id/tasks', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { taskIndex, action, userId } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log(`[AgreementController] Updating task for agreement ${id}, task index ${taskIndex}, action: ${action}`);
    
    if (taskIndex === undefined || !action) {
      return res.status(400).json({ message: 'Missing required fields: taskIndex and action' });
    }

    // Validate actions
    if (!['assign', 'unassign', 'complete'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Must be assign, unassign, or complete' });
    }

    // Get the agreement with the AgreementController
    const agreement = await agreementController.getAgreementForTaskUpdate(id, req, res);
    if (!agreement) return; // Response already sent by the controller

    // Get the current task
    if (!agreement.check_items || !agreement.check_items[taskIndex]) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const currentTask = agreement.check_items[taskIndex];
    const userRole = req.propertyRole; // Set by the controller

    // Handle different actions with permission checks
    if (action === 'assign') {
      // Owners can assign to anyone, tenants can only self-assign
      if (userRole === 'owner' || (userRole === 'tenant' && userId === user.id)) {
        currentTask.assigned_to = userId;
      } else {
        return res.status(403).json({ message: 'You can only assign tasks to yourself' });
      }
    } 
    else if (action === 'unassign') {
      // Owners can unassign anyone, tenants can only unassign themselves
      if (userRole === 'owner' || (userRole === 'tenant' && currentTask.assigned_to === user.id)) {
        currentTask.assigned_to = null;
      } else {
        return res.status(403).json({ message: 'You can only unassign tasks assigned to you' });
      }
    }
    else if (action === 'complete') {
      // For 'complete' action, toggle the checked status
      // Permission check: Owners can check any task, but tenants can only check tasks assigned to them or unassigned tasks
      if (userRole === 'owner' || 
          currentTask.assigned_to === null || 
          currentTask.assigned_to === user.id) {
        
        // Toggle checked status
        currentTask.checked = !currentTask.checked;
        
        // If marking as checked, record who completed it
        if (currentTask.checked) {
          currentTask.completed_by = user.id;
          currentTask.completed_at = new Date().toISOString();
        } else {
          // If unchecking, remove completion details
          currentTask.completed_by = null;
          currentTask.completed_at = null;
        }
      } else {
        return res.status(403).json({ message: 'You can only complete tasks assigned to you' });
      }
    }

    // Update the agreement with modified task
    const updatedAgreement = await agreementController.updateTasksOnly(id, agreement.check_items, req, res);
    
    if (updatedAgreement) {
      res.json(updatedAgreement);
    }
  } catch (error) {
    console.error(`[AgreementController] Error updating task for agreement ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update task' });
  }
});

/**
 * Delete an agreement
 */
router.delete('/:id', agreementController.deleteAgreement.bind(agreementController));

export default router; 