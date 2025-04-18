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
exports.authenticateUser = void 0;
const supabase_1 = require("../services/supabase");
/**
 * Extract the JWT token from the request headers
 */
const extractToken = (req) => {
    // Check for Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    return null;
};
/**
 * Middleware to verify JWT token and authenticate the user using Supabase's API
 * This approach is more secure as it verifies the token with Supabase servers
 * though it's slightly slower due to the network call
 */
const authenticateUser = (req, res, next) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
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
            const { data: { user }, error } = yield supabase_1.supabase.auth.getUser(token);
            if (error) {
                console.error('Token verification error:', error.message);
                // Determine the appropriate error response based on the error
                if (error.message.includes('expired')) {
                    return res.status(401).json({
                        success: false,
                        message: 'Token has expired. Please log in again.'
                    });
                }
                if (error.message.includes('invalid')) {
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid authentication token'
                    });
                }
                return res.status(401).json({
                    success: false,
                    message: 'Authentication failed'
                });
            }
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }
            // Add the user to the request object for use in route handlers
            req.user = user;
            // Continue to the route handler
            next();
        }
        catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error during authentication',
                error: error.message
            });
        }
    }))();
};
exports.authenticateUser = authenticateUser;
