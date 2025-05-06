import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET agreements handler
export async function GET(req: NextRequest) {
  try {
    // Get authorization header directly from the incoming request
    const authHeader = req.headers.get('authorization');
    console.log('Authorization header from client:', authHeader ? 'exists' : 'missing');
    
    if (!authHeader) {
      console.log('No authorization header found in request, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query params
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('propertyId');
    
    // Forward the request to the backend with the same authorization header
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    let endpoint = '/agreements';
    
    // Add query parameters if provided
    if (propertyId) {
      endpoint += `?propertyId=${propertyId}`;
    }
    
    console.log('Forwarding request to backend at:', `${backendUrl}${endpoint}`);
    console.log('Using client authorization header');
    
    // Make request to the backend API to get agreements
    const response = await fetch(`${backendUrl}${endpoint}`, {
      headers: {
        'Authorization': authHeader, // Forward the same auth header
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // Don't cache this request
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.log('Backend error data:', errorData);
        return NextResponse.json(
          { error: errorData.message || 'Failed to fetch agreements' },
          { status: response.status }
        );
      } catch (e) {
        console.log('Could not parse error response:', e);
        return NextResponse.json(
          { error: 'Failed to fetch agreements' },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    console.log('Agreements fetched successfully:', data);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in GET /api/agreements:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
      { status: 500 }
    );
  }
}

// POST to create a new agreement
export async function POST(req: NextRequest) {
  try {
    // Get authorization header directly from the incoming request
    const authHeader = req.headers.get('authorization');
    console.log('Authorization header from client:', authHeader ? 'exists' : 'missing');
    
    if (!authHeader) {
      console.log('No authorization header found in request, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const agreementData = await req.json();
    
    // Validate required fields
    if (!agreementData.title || !agreementData.propertyId || !agreementData.checkItems) {
      return NextResponse.json(
        { error: 'Missing required fields: title, propertyId, and checkItems' },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend with the same authorization header
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const endpoint = '/agreements';
    
    console.log('Forwarding request to backend at:', `${backendUrl}${endpoint}`);
    
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader // Forward the same auth header
      },
      body: JSON.stringify(agreementData),
      next: { revalidate: 0 } // Don't cache this request
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.log('Backend error data:', errorData);
        return NextResponse.json(
          { error: errorData.message || 'Failed to create agreement' },
          { status: response.status }
        );
      } catch (e) {
        console.log('Could not parse error response:', e);
        return NextResponse.json(
          { error: 'Failed to create agreement' },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error creating agreement:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 