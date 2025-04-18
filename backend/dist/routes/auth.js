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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Initialize router
const router = (0, express_1.Router)();
// Get Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
// Check if Supabase URL and key are available
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: SUPABASE_URL or SUPABASE_ANON_KEY environment variables are not set');
    // We'll still create the client, but it will likely fail
}
// Create Supabase client
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
// Register a new user
router.post('/register', (req, res) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }
            const { data, error } = yield supabase.auth.signUp({
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
});
// Login user
router.post('/login', (req, res) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }
            const { data, error } = yield supabase.auth.signInWithPassword({
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
});
// Logout user
router.post('/logout', (_req, res) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { error } = yield supabase.auth.signOut();
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
});
// Get current user
router.get('/me', (_req, res) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const { data: { user }, error } = yield supabase.auth.getUser();
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
});
exports.default = router;
