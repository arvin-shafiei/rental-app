import express, { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize router
const router = Router();

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Check if Supabase URL and key are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_ANON_KEY environment variables are not set');
  // We'll still create the client, but it will likely fail
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define your route handlers
interface AuthRequestBody {
  email: string;
  password: string;
}

// Register a new user
router.post('/register', (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
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
});

// Login user
router.post('/login', (req: Request<{}, {}, AuthRequestBody>, res: Response) => {
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
});

// Logout user
router.post('/logout', (_req: Request, res: Response) => {
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
});

// Get current user
router.get('/me', (_req: Request, res: Response) => {
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
});

export default router; 