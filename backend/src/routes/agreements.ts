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
    const { taskIndex, action, userId, notificationDays } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log(`[AgreementController] Updating task for agreement ${id}, task index ${taskIndex}, action: ${action}`);
    console.log(`[AgreementController] Task update details:`, {
      userId,
      notificationDays,
      notificationDaysType: notificationDays !== undefined ? typeof notificationDays : 'undefined'
    });
    
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
    console.log(`[AgreementController] Current task state:`, currentTask);
    
    // Check if user is the creator of the agreement
    const isCreator = agreement.created_by === user.id;

    // Handle different actions with permission checks
    if (action === 'assign') {
      // Agreement creators can assign to anyone, others can only self-assign
      if (isCreator || userId === user.id) {
        currentTask.assigned_to = userId;
        
        // Set notification days if provided
        if (notificationDays !== undefined) {
          currentTask.notification_days_before = notificationDays;
          console.log(`[AgreementController] Setting notification_days_before to:`, notificationDays);
        }
      } else {
        return res.status(403).json({ message: 'You can only assign tasks to yourself' });
      }
    } 
    else if (action === 'unassign') {
      // Agreement creators can unassign anyone, others can only unassign themselves
      if (isCreator || currentTask.assigned_to === user.id) {
        currentTask.assigned_to = null;
        
        // Clear notification days when unassigning
        currentTask.notification_days_before = null;
        console.log(`[AgreementController] Clearing notification_days_before`);
      } else {
        return res.status(403).json({ message: 'You can only unassign tasks assigned to you' });
      }
    }
    else if (action === 'complete') {
      // For 'complete' action, toggle the checked status
      // Permission check: Agreement creators can check any task, others can only check tasks assigned to them or unassigned tasks
      if (isCreator || 
          currentTask.assigned_to === null || 
          currentTask.assigned_to === user.id) {
        
        // Toggle checked status
        currentTask.checked = !currentTask.checked;
        
        // If marking as checked, record who completed it
        if (currentTask.checked) {
          currentTask.completed_by = user.id;
          currentTask.completed_at = new Date().toISOString();
          
          // Preserve notification_days_before - don't modify it
          console.log(`[AgreementController] Preserving notification_days_before value:`, currentTask.notification_days_before);
        } else {
          // If unchecking, remove completion details
          currentTask.completed_by = null;
          currentTask.completed_at = null;
          
          // Preserve notification_days_before - don't modify it
          console.log(`[AgreementController] Preserving notification_days_before value:`, currentTask.notification_days_before);
        }
      } else {
        return res.status(403).json({ message: 'You can only complete tasks assigned to you' });
      }
    }

    console.log(`[AgreementController] Updated task state before saving:`, currentTask);

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