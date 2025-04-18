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
 * Middleware to check if the user is authenticated
 * This can be used on protected routes
 */
const authenticateUser = (req, res, next) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Get session from Supabase (will use cookies/headers automatically)
            const { data: { user }, error } = yield supabase_1.supabase.auth.getUser();
            if (error || !user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }
            // Add the user to the request object for use in route handlers
            req.user = user;
            // Continue to the route handler
            next();
        }
        catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Server error during authentication',
                error: error.message
            });
        }
    }))();
};
exports.authenticateUser = authenticateUser;
