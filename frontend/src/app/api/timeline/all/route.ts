import { NextRequest, NextResponse } from 'next/server';

// GET all timeline events handler
export async function GET(req: NextRequest) {
  try {
    // Get authorization header directly from the incoming request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get any query parameters
    const url = new URL(req.url);
    const days = url.searchParams.get('days');
    
    // Forward the request to the backend with the same authorization header
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const queryString = days ? `?days=${days}` : '';
    const endpoint = `/timeline/all${queryString}`;
    
    // Make request to the backend API
    const response = await fetch(`${backendUrl}${endpoint}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // Don't cache this request
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.message || 'Failed to fetch timeline events' },
          { status: response.status }
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to fetch timeline events' },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/timeline/all:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 