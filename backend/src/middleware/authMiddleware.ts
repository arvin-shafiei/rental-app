import { Request, Response, NextFunction } from 'express';
import { validateToken } from '../utils/supabaseClient';

/**
 * Extract the JWT token from the request headers
 */
const extractToken = (req: Request): string | null => {
  // Check for Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
  
  return null;
};

/**
 * Middleware to authenticate the user using Supabase JWT token
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from headers
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is required'
      });
    }
    
    // Verify the token with Supabase
    const user = await validateToken(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication token'
      });
    }
    
    // Add the user to the request object for use in route handlers
    (req as any).user = user;
    
    // Continue to the route handler
    next();
  } catch (error: any) {
    console.error('Error during authentication:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: error.message
    });
  }
}; 