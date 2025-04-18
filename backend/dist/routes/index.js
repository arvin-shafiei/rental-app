"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const protected_1 = __importDefault(require("./protected"));
// Initialize main router
const router = (0, express_1.Router)();
// Use the auth routes under the /auth path
router.use('/auth', auth_1.default);
// Use the protected routes under the /protected path
router.use('/protected', protected_1.default);
exports.default = router;
