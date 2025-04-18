import { Request, Response } from 'express';
import { supabase } from '../services/supabase';
import { AuthRequestBody } from '../types/auth';

export class AuthController {
  /**
   * Register a new user
   */
  static register(req: Request<{}, {}, AuthRequestBody>, res: Response) {
    (async () => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
          });
        }
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          return res.status(400).json({ 
            success: false, 
            message: error.message 
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          data: data.user,
          message: 'Registration successful! Please check your email to confirm your account.' 
        });
      } catch (error: any) {
        return res.status(500).json({ 
          success: false, 
          message: 'Server error during registration',
          error: error.message
        });
      }
    })();
  }

  /**
   * Login user
   */
  static login(req: Request<{}, {}, AuthRequestBody>, res: Response) {
    (async () => {
      try {
        const { email, password } = req.body;
        
        if (!email || !password) {
          return res.status(400).json({ 
            success: false, 
            message: 'Email and password are required' 
          });
        }
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        
        if (error) {
          return res.status(400).json({ 
            success: false, 
            message: error.message 
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          data: {
            user: data.user,
            session: data.session
          },
          message: 'Login successful' 
        });
      } catch (error: any) {
        return res.status(500).json({ 
          success: false, 
          message: 'Server error during login',
          error: error.message
        });
      }
    })();
  }

  /**
   * Logout user
   */
  static logout(_req: Request, res: Response) {
    (async () => {
      try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          return res.status(400).json({ 
            success: false, 
            message: error.message 
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          message: 'Logged out successfully' 
        });
      } catch (error: any) {
        return res.status(500).json({ 
          success: false, 
          message: 'Server error during logout',
          error: error.message
        });
      }
    })();
  }

  /**
   * Get current user
   */
  static getCurrentUser(_req: Request, res: Response) {
    (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          return res.status(401).json({ 
            success: false, 
            message: 'Not authenticated' 
          });
        }
        
        return res.status(200).json({ 
          success: true, 
          data: { user },
          message: 'User data retrieved successfully' 
        });
      } catch (error: any) {
        return res.status(500).json({ 
          success: false, 
          message: 'Server error while fetching user data',
          error: error.message
        });
      }
    })();
  }
} 