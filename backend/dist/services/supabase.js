"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Get Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
// Check if Supabase URL and key are available
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Error: SUPABASE_URL or SUPABASE_ANON_KEY environment variables are not set');
    // We'll still create the client, but it will likely fail
}
// Create and export Supabase client
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
