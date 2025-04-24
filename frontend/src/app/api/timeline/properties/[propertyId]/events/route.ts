import { NextRequest, NextResponse } from 'next/server';

// GET property timeline events handler
export async function GET(
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
    
    // Forward the request to the backend with the same authorization header
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const endpoint = `/timeline/properties/${propertyId}/events`;
    
    console.log('Forwarding request to backend at:', `${backendUrl}${endpoint}`);
    
    // Make request to the backend API
    const response = await fetch(`${backendUrl}${endpoint}`, {
      headers: {
        'Authorization': authHeader,
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
          { error: errorData.message || 'Failed to fetch timeline events' },
          { status: response.status }
        );
      } catch (e) {
        console.log('Could not parse error response:', e);
        return NextResponse.json(
          { error: 'Failed to fetch timeline events' },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    console.log('Timeline events fetched successfully');
    
    // Handle both possible response formats
    let eventsArray;
    if (Array.isArray(data)) {
      console.log('Backend returned an array with', data.length, 'events');
      return NextResponse.json(data);
    } else if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
      console.log('Backend returned object with data array containing', data.data.length, 'events');
      return NextResponse.json(data.data);
    } else {
      console.log('Backend returned unexpected data format:', JSON.stringify(data).slice(0, 200) + '...');
      return NextResponse.json([]);
    }
  } catch (error: any) {
    console.error('Error in GET /api/timeline/properties/[propertyId]/events:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 