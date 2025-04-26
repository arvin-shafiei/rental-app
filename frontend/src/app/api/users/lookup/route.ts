import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const id = searchParams.get('id');
  
  // Require either email or id
  if (!email && !id) {
    return NextResponse.json({ error: 'Either email or id is required' }, { status: 400 });
  }
  
  try {
    // Get authorization header directly from the incoming request
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header from client:', authHeader ? 'exists' : 'missing');
    
    if (!authHeader) {
      console.log('No authorization header found in request, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Call our backend API with the appropriate endpoint
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    let endpoint = '';
    
    if (email) {
      endpoint = `/users/lookup?email=${encodeURIComponent(email)}`;
    } else if (id) {
      endpoint = `/users/${id}`;
    }
    
    console.log('Forwarding request to backend at:', `${backendUrl}${endpoint}`);
    
    const response = await fetch(`${backendUrl}${endpoint}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // Don't cache this request
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to lookup user' },
        { status: response.status }
      );
    }
    
    const responseData = await response.json();
    
    // If the backend returns a standard format with success/data properties, extract the data
    if (responseData && responseData.success === true && responseData.data) {
      return NextResponse.json(responseData.data);
    }
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('[API] Error looking up user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 