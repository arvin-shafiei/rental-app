"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const supabase_1 = require("../services/supabase");
// Helper function to extract token from the request headers
const extractToken = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
};
class AuthController {
    /**
     * Register a new user
     */
    static register(req, res) {
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email and password are required'
                    });
                }
                const { data, error } = yield supabase_1.supabase.auth.signUp({
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
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Server error during registration',
                    error: error.message
                });
            }
        }))();
    }
    /**
     * Login user
     */
    static login(req, res) {
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                const { email, password } = req.body;
                if (!email || !password) {
                    return res.status(400).json({
                        success: false,
                        message: 'Email and password are required'
                    });
                }
                const { data, error } = yield supabase_1.supabase.auth.signInWithPassword({
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
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Server error during login',
                    error: error.message
                });
            }
        }))();
    }
    /**
     * Logout user
     */
    static logout(req, res) {
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                // Extract token from headers for security
                const token = extractToken(req);
                if (!token) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required to logout'
                    });
                }
                // Verify the user is authenticated before logging out
                const { error: getUserError } = yield supabase_1.supabase.auth.getUser(token);
                if (getUserError) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid authentication token'
                    });
                }
                const { error } = yield supabase_1.supabase.auth.signOut();
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
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Server error during logout',
                    error: error.message
                });
            }
        }))();
    }
    /**
     * Get current user
     */
    static getCurrentUser(req, res) {
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                // Extract token from headers for consistency with middleware
                const token = extractToken(req);
                if (!token) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication token is required'
                    });
                }
                const { data: { user }, error } = yield supabase_1.supabase.auth.getUser(token);
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
            }
            catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Server error while fetching user data',
                    error: error.message
                });
            }
        }))();
    }
}
exports.AuthController = AuthController;
