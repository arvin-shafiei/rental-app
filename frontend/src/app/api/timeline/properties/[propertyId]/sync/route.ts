import { NextRequest, NextResponse } from 'next/server';

// POST to sync property timeline events
export async function POST(
  req: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const propertyId = params.propertyId;
    
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
    
    // Get the request body (sync options)
    const requestBody = await req.json();
    
    // Forward the request to the backend with the same authorization header
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const endpoint = `/timeline/properties/${propertyId}/sync`;
    
    console.log('Forwarding request to backend at:', `${backendUrl}${endpoint}`);
    
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(requestBody),
      next: { revalidate: 0 } // Don't cache this request
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.log('Backend error data:', errorData);
        return NextResponse.json(
          { error: errorData.message || 'Failed to sync timeline' },
          { status: response.status }
        );
      } catch (e) {
        console.log('Could not parse error response:', e);
        return NextResponse.json(
          { error: 'Failed to sync timeline' },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error syncing property timeline:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 