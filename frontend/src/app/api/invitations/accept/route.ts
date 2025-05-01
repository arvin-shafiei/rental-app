import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header directly from the incoming request
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header from client:', authHeader ? 'exists' : 'missing');
    
    if (!authHeader) {
      console.log('No authorization header found in request, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    
    if (!body.token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }
    
    // Call our backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const endpoint = `/property-users/invitations/accept`;
    
    console.log('Forwarding invitation acceptance request to backend at:', `${backendUrl}${endpoint}`);
    
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      next: { revalidate: 0 } // Don't cache this request
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to accept invitation' },
        { status: response.status }
      );
    }
    
    const responseData = await response.json();
    
    // If the backend returns a standard format with success/data properties, extract the data
    if (responseData && responseData.success === true && responseData.data) {
      // Return just the data to simplify frontend handling
      return NextResponse.json(responseData.data);
    }
    
    // Otherwise return the full response
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('[API] Error accepting invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 