// Load environment variables first, before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Import other dependencies
import express, { Request, Response } from 'express';
import cors from 'cors';
import routes from './routes';

// Create an instance of the Express application
const app = express();

// Define the port number the server will listen on
const port = process.env.PORT || 3001;

// Apply middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Add request logging middleware
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Define a simple "route" handler for the root path ('/')
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the Concurrent TypeScript Backend!');
});

// Use the defined routes
app.use('/api', routes);

// Start the Express server and make it listen for incoming requests on the specified port
app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
  
  // Log environment variables status
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('WARNING: Supabase environment variables might not be properly set.');
    console.warn('Make sure your .env file contains valid SUPABASE_URL and SUPABASE_ANON_KEY values.');
  } else {
    console.log('Supabase environment variables loaded successfully.');
  }
}); 