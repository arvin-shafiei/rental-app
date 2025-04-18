import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase';

/**
 * Middleware to check if the user is authenticated
 * This can be used on protected routes
 */
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  (async () => {
    try {
      // Get session from Supabase (will use cookies/headers automatically)
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      
      // Add the user to the request object for use in route handlers
      (req as any).user = user;
      
      // Continue to the route handler
      next();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication',
        error: error.message
      });
    }
  })();
}; 