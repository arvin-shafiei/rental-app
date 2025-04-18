"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
// Initialize router
const router = (0, express_1.Router)();
// This is a protected route - requires authentication
router.get('/', auth_1.authenticateUser, (req, res) => {
    try {
        // The user is available as req.user
        const user = req.user;
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error in protected route',
            error: error.message
        });
    }
});
// Example of a more specific protected resource
router.get('/profile', auth_1.authenticateUser, (req, res) => {
    try {
        const user = req.user;
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
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving profile data',
            error: error.message
        });
    }
});
exports.default = router;
