import { Request, Response, NextFunction } from 'express';
import { supabase } from '../services/supabase';

/**
 * Extract the JWT token from the request headers
 */
const extractToken = (req: Request): string | null => {
  // Check for Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  
  console.log('[Auth] Authorization header:', authHeader);
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('[Auth] Token extracted from Authorization header (length):', token.length);
    return token;
  }
  
  console.log('[Auth] No valid token found in request headers');
  return null;
};

/**
 * Middleware to verify Supabase JWT token and authenticate the user
 */
export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  console.log('[Auth] Starting authentication process');
  
  (async () => {
    try {
      // Extract token from headers
      const token = extractToken(req);
      
      if (!token) {
        console.log('[Auth] Authentication failed: No token provided');
        return res.status(401).json({
          success: false,
          message: 'Authentication token is required'
        });
      }
      
      console.log('[Auth] Verifying token with Supabase...');
      
      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error) {
        console.error('[Auth] Token verification failed:', error.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired authentication token',
          error: error.message
        });
      }
      
      if (!user) {
        console.log('[Auth] Token valid but no user found');
        return res.status(401).json({
          success: false,
          message: 'Valid token but no user found'
        });
      }
      
      console.log(`[Auth] User authenticated successfully: ${user.id} (${user.email})`);
      
      // Add the user to the request object for use in route handlers
      (req as any).user = user;
      
      // Continue to the route handler
      next();
    } catch (error: any) {
      console.error('[Auth] Unexpected error during authentication:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during authentication',
        error: error.message
      });
    }
  })();
}; 