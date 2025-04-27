import { Router } from 'express';
import { AgreementController } from '../controllers/agreementController';
import { authenticateUser } from '../middleware/auth';

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
 * Delete an agreement
 */
router.delete('/:id', agreementController.deleteAgreement.bind(agreementController));

export default router; 