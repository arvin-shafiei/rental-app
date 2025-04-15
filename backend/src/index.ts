// Import the express library, which helps us build web servers
import express, { Request, Response } from 'express';
// Import the function to create a Supabase client
import { createClient } from '@supabase/supabase-js';

// --- Supabase Configuration ---
// IMPORTANT: Replace these placeholders with your actual Supabase project URL and anon key!
// You can find these in your Supabase project settings under API.
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Check if the placeholder values are still being used
if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn(
    'Supabase URL or Anon Key is not set. Please provide them in .env file or replace placeholders in src/index.ts'
  );
}

// Create a Supabase client instance
// This object will be used to interact with your Supabase backend (database, auth, etc.)
// We are not using it in this basic example, but it's ready for you to use.
const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase client initialized (check warnings if using placeholders).');

// --- Express Server Setup ---

// Create an instance of the Express application
const app = express();

// Define the port number the server will listen on
// It's common to use environment variables for this, but we'll hardcode it for simplicity for now.
const port = 3001; // Often backend servers run on ports like 3001, 5000, 8000, etc.

// Define a simple "route" handler for the root path ('/')
// When someone accesses http://localhost:3001/, this function will run.
// req: Represents the incoming request from the client (e.g., browser)
// res: Represents the response we will send back to the client
app.get('/', (req: Request, res: Response) => {
  // Send a simple text response back
  res.send('Hello from the Concurrent TypeScript Backend!');
});

// Start the Express server and make it listen for incoming requests on the specified port
app.listen(port, () => {
  // This message will be printed to the console when the server starts successfully
  console.log(`Backend server listening at http://localhost:${port}`);
}); 