"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables first, before any other imports
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Import other dependencies
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
// Create an instance of the Express application
const app = (0, express_1.default)();
// Define the port number the server will listen on
const port = process.env.PORT || 3001;
// Apply middleware
app.use((0, cors_1.default)()); // Enable CORS for all routes
app.use(express_1.default.json()); // Parse JSON request bodies
// Define a simple "route" handler for the root path ('/')
app.get('/', (req, res) => {
    res.send('Hello from the Concurrent TypeScript Backend!');
});
// Use the defined routes
app.use('/api', routes_1.default);
// Start the Express server and make it listen for incoming requests on the specified port
app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
    // Log environment variables status
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        console.warn('WARNING: Supabase environment variables might not be properly set.');
        console.warn('Make sure your .env file contains valid SUPABASE_URL and SUPABASE_ANON_KEY values.');
    }
    else {
        console.log('Supabase environment variables loaded successfully.');
    }
});
