import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper function to get a token if none is provided in the request
async function getAuthToken() {
  try {
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    
    // Get the current session
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// GET handler for contract summaries
export async function GET(req: NextRequest) {
  try {
    console.log('API route handler called: /api/contracts/summaries');
    
    // Get query params
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    console.log(`Received request for contract summaries with userId: ${userId || 'none'}`);

    // Build query string
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('userId', userId);
    queryParams.append('limit', limit);
    queryParams.append('offset', offset);

    // Get authorization header directly from the incoming request
    let authHeader = req.headers.get('authorization');
    console.log('Authorization header from client:', authHeader ? 'exists' : 'missing');
    
    // If no auth header, try to get one from Supabase
    if (!authHeader) {
      console.log('No auth header provided, attempting to get one from Supabase...');
      const token = await getAuthToken();
      if (token) {
        authHeader = `Bearer ${token}`;
        console.log('Successfully obtained auth token from Supabase');
      } else {
        console.log('Failed to get auth token from Supabase');
      }
    }
    
    // Forward the request to the backend with the same authorization header
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const endpoint = '/contracts/summaries';
    
    console.log('Forwarding request to backend at:', `${backendUrl}${endpoint}?${queryParams.toString()}`);
    
    // Make request to the backend API
    const response = await fetch(`${backendUrl}${endpoint}?${queryParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {})
      },
      next: { revalidate: 0 } // Don't cache this request
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.log('Backend error data:', errorData);
        return NextResponse.json(
          { success: false, error: errorData.error || 'Failed to fetch contract summaries' },
          { status: response.status }
        );
      } catch (e) {
        console.log('Could not parse error response:', e);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch contract summaries' },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    console.log('Contract summaries fetched successfully, count:', data.data?.length || 0);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/contracts/summaries:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/contracts/summaries/:id
 * Fetches a specific contract summary by ID
 */
export async function generateStaticParams() {
  return [];
} 