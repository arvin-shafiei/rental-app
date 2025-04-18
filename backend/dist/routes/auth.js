"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../controllers/auth");
// Initialize router
const router = (0, express_1.Router)();
// Auth routes
router.post('/register', auth_1.AuthController.register);
router.post('/login', auth_1.AuthController.login);
router.post('/logout', auth_1.AuthController.logout);
router.get('/me', auth_1.AuthController.getCurrentUser);
exports.default = router;
