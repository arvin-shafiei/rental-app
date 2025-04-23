import { Router } from 'express';
import { PropertyController } from '../controllers/propertyController';
import { authenticateUser } from '../middleware/auth';

// Initialize router
const router = Router();

// Initialize controller
const propertyController = new PropertyController();

// Detailed logging middleware for properties routes
router.use((req, res, next) => {
  console.log(`[Properties API] Processing ${req.method} ${req.path}`);
  next();
});

// GET all properties for the authenticated user
router.get(
  '/',
  (req, res, next) => {
    console.log('[Properties API] Attempting to authenticate user for GET /properties');
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log('[Properties API] User authenticated successfully, proceeding to get properties');
    next();
  },
  propertyController.getUserProperties.bind(propertyController)
);

// GET a specific property by ID
router.get(
  '/:id',
  (req, res, next) => {
    console.log(`[Properties API] Attempting to authenticate user for GET /properties/${req.params.id}`);
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log(`[Properties API] User authenticated successfully, proceeding to get property ID: ${req.params.id}`);
    next();
  },
  propertyController.getPropertyById.bind(propertyController)
);

// POST create a new property
router.post(
  '/',
  (req, res, next) => {
    console.log('[Properties API] Attempting to authenticate user for POST /properties');
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log('[Properties API] User authenticated successfully, proceeding to create property');
    next();
  },
  propertyController.createProperty.bind(propertyController)
);

// PUT update an existing property
router.put(
  '/:id',
  (req, res, next) => {
    console.log(`[Properties API] Attempting to authenticate user for PUT /properties/${req.params.id}`);
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log(`[Properties API] User authenticated successfully, proceeding to update property ID: ${req.params.id}`);
    next();
  },
  propertyController.updateProperty.bind(propertyController)
);

// DELETE a property
router.delete(
  '/:id',
  (req, res, next) => {
    console.log(`[Properties API] Attempting to authenticate user for DELETE /properties/${req.params.id}`);
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log(`[Properties API] User authenticated successfully, proceeding to delete property ID: ${req.params.id}`);
    next();
  },
  propertyController.deleteProperty.bind(propertyController)
);

export default router; 