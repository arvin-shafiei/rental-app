import { Router } from 'express';
import { Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabaseAdmin } from '../services/supabase';

// Initialize the router
const router = Router();

// Detailed logging middleware for user routes
router.use((req, res, next) => {
  console.log(`[Users API] Processing ${req.method} ${req.path}`);
  next();
});

// GET lookup a user by email
router.get(
  '/lookup',
  (req, res, next) => {
    console.log(`[Users API] Attempting to authenticate user for GET /users/lookup`);
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log(`[Users API] User authenticated successfully, proceeding to lookup user by email`);
    next();
  },
  async (req: Request, res: Response) => {
    const requesterId = (req as any).user?.id;
    const email = req.query.email as string;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    console.log(`[Users API] Looking up user by email: ${email}, requester: ${requesterId}`);
    
    try {
      // Look up user by email
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, email, avatar_url')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error(`[Users API] Error looking up user: ${error.message}`);
        
        // If no rows returned, the user doesn't exist
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        
        throw error;
      }
      
      console.log(`[Users API] User found: ${data.id}`);
      
      res.status(200).json({
        success: true,
        message: 'User found',
        data
      });
    } catch (error: any) {
      console.error(`[Users API] Error looking up user: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error looking up user',
        error: error.message
      });
    }
  }
);

// GET a user by ID
router.get(
  '/:id',
  (req, res, next) => {
    console.log(`[Users API] Attempting to authenticate user for GET /users/${req.params.id}`);
    next();
  },
  authenticateUser,
  (req, res, next) => {
    console.log(`[Users API] User authenticated successfully, proceeding to get user by ID: ${req.params.id}`);
    next();
  },
  async (req: Request, res: Response) => {
    const requesterId = (req as any).user?.id;
    const userId = req.params.id;
    
    console.log(`[Users API] Getting user by ID: ${userId}, requester: ${requesterId}`);
    
    try {
      // Look up user by ID
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, display_name, email, avatar_url')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error(`[Users API] Error getting user by ID: ${error.message}`);
        
        // If no rows returned, the user doesn't exist
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        
        throw error;
      }
      
      console.log(`[Users API] User found: ${data.id}`);
      
      res.status(200).json({
        success: true,
        message: 'User found',
        data
      });
    } catch (error: any) {
      console.error(`[Users API] Error getting user by ID: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error getting user',
        error: error.message
      });
    }
  }
);

export default router; 