import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import * as stripeController from '../controllers/stripeController';
import express from 'express';

const router = Router();

// Sync plans from Stripe when server starts
// This ensures our database has the latest plans from Stripe
stripeController.syncStripePlans().then(() => {
  console.log('Stripe plans synced on server start');
}).catch(err => {
  console.error('Failed to sync Stripe plans on server start:', err);
});

// Get all subscription plans
router.get('/plans', stripeController.getPlans);

// Get user's current subscription
router.get('/subscriptions/user/:userId', authenticateUser, stripeController.getUserSubscription);

// Manually sync a user's subscription from Stripe to the database
router.post('/sync-subscription/:userId', authenticateUser, stripeController.syncUserSubscription);

// Create checkout session
router.post('/create-checkout', authenticateUser, stripeController.createCheckoutSession);

// Create customer portal session
router.post('/create-portal-session', authenticateUser, stripeController.createPortalSession);

// Sync plans from Stripe (admin only)
router.post('/sync-plans', authenticateUser, stripeController.syncPlans);

// Cancel a subscription
router.post('/cancel-subscription', authenticateUser, stripeController.cancelSubscription);

// Check feature limits - both POST and GET methods supported
router.post('/check-limits', authenticateUser, stripeController.checkFeatureLimits);
router.get('/check-limits', authenticateUser, async (req, res) => {
  try {
    // For GET requests, extract the userId from the authenticated user
    // and feature from query parameters
    const userId = (req as any).user?.id;  // Access user property added by middleware
    const feature = req.query.feature as string;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!feature) {
      return res.status(400).json({ error: 'Missing required parameter: feature' });
    }
    
    // Use the existing controller method with the reconstructed body
    req.body = { userId, feature };
    return stripeController.checkFeatureLimits(req, res);
  } catch (error) {
    console.error('Error in GET check-limits endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Increment feature usage
router.post('/increment-usage', authenticateUser, stripeController.incrementFeatureUsage);

// Webhook endpoint - no authentication needed
// We need to use raw body for webhook verification
router.post('/webhook', 
  express.raw({ type: 'application/json' }), 
  stripeController.handleWebhook
);

export default router; 