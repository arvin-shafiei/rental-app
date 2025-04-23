// Load environment variables first, before any other imports
import dotenv from 'dotenv';
dotenv.config();

// Import other dependencies
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes';

// Create an instance of the Express application
const app = express();

// Define the port number the server will listen on
const port = process.env.PORT || 3001;

// Apply middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded form data

// Add detailed request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  
  // Capture the original end method
  const originalEnd = res.end;
  
  // Override the end method to log the response
  res.end = function(chunk?: any, encoding?: any, callback?: any) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Response ${res.statusCode} - ${duration}ms`);
    
    // Call the original end method
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
});

// Define a simple "route" handler for the root path ('/')
app.get('/', (req: Request, res: Response) => {
  res.send('Hello from the Concurrent TypeScript Backend!');
});

// Add a health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Backend server is up and running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debugging endpoint to check request path parsing
app.get('/api/debug', (req: Request, res: Response) => {
  res.status(200).json({
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
    params: req.params,
    query: req.query
  });
});

// Use the defined routes
app.use('/api', routes);

// Add 404 handler for undefined routes
app.use((req: Request, res: Response) => {
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// Start the Express server and make it listen for incoming requests on the specified port
app.listen(port, () => {
  console.log(`[${new Date().toISOString()}] Backend server listening at http://localhost:${port}`);
  
  // Log environment variables status
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
    console.warn('WARNING: Supabase environment variables might not be properly set.');
    console.warn('Make sure your .env file contains valid SUPABASE_URL and SUPABASE_ANON_KEY values.');
  } else {
    console.log('Supabase environment variables loaded successfully.');
  }
  
  // Log route mounting information
  console.log(`API routes are mounted at: /api`);
  console.log(`Example endpoints:`);
  console.log(`- GET /api/health - For checking server health`);
  console.log(`- GET /api/properties - For fetching properties (requires auth)`);
}); 