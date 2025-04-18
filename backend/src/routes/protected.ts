import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';

// Initialize router
const router = Router();

// This is a protected route - requires authentication
router.get('/', authenticateUser, (req: Request, res: Response) => {
  try {
    // The user is available as req.user
    const user = (req as any).user;
    
    res.status(200).json({
      success: true,
      message: 'This is a protected route',
      data: {
        user: {
          id: user.id,
          email: user.email,
          // Don't send sensitive data back to the client
          // Only include necessary user information
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error in protected route',
      error: error.message
    });
  }
});

// Example of a more specific protected resource
router.get('/profile', authenticateUser, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    res.status(200).json({
      success: true,
      message: 'Profile data retrieved successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          // Additional user profile data would go here
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving profile data',
      error: error.message
    });
  }
});

export default router; 