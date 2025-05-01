import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { PropertyUserController } from '../controllers/propertyUserController';

// Initialize the router and controller
const router = Router();
const propertyUserController = new PropertyUserController();

// Detailed logging middleware for property users routes
router.use((req, res, next) => {
  console.log(`[PropertyUsers API] Processing ${req.method} ${req.path}`);
  next();
});

// GET all users for a property
router.get(
  '/properties/:propertyId/users',
  (req, res, next) => {
    console.log(`[PropertyUsers API] Attempting to authenticate user for GET /properties/${req.params.propertyId}/users`);
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log(`[PropertyUsers API] User authenticated successfully, proceeding to get users for property ID: ${req.params.propertyId}`);
    next();
  },
  propertyUserController.getPropertyUsers.bind(propertyUserController)
);

// POST add a user to a property
router.post(
  '/properties/:propertyId/users',
  (req, res, next) => {
    console.log(`[PropertyUsers API] Attempting to authenticate user for POST /properties/${req.params.propertyId}/users`);
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log(`[PropertyUsers API] User authenticated successfully, proceeding to add user to property ID: ${req.params.propertyId}`);
    next();
  },
  propertyUserController.addUserToProperty.bind(propertyUserController)
);

// DELETE remove a user from a property
router.delete(
  '/properties/:propertyId/users/:userId',
  (req, res, next) => {
    console.log(`[PropertyUsers API] Attempting to authenticate user for DELETE /properties/${req.params.propertyId}/users/${req.params.userId}`);
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log(`[PropertyUsers API] User authenticated successfully, proceeding to remove user ${req.params.userId} from property ID: ${req.params.propertyId}`);
    next();
  },
  propertyUserController.removeUserFromProperty.bind(propertyUserController)
);

// POST accept an invitation to join a property
router.post(
  '/invitations/accept',
  (req, res, next) => {
    console.log(`[PropertyUsers API] Attempting to authenticate user for POST /invitations/accept`);
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log(`[PropertyUsers API] User authenticated successfully, proceeding to accept invitation`);
    next();
  },
  propertyUserController.acceptInvitation.bind(propertyUserController)
);

export default router; 