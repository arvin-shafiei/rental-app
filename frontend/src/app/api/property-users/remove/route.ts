import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get('propertyId');
  const userId = searchParams.get('userId');
  
  if (!propertyId || !userId) {
    return NextResponse.json({ error: 'Property ID and User ID are required' }, { status: 400 });
  }
  
  try {
    // Get authorization header directly from the incoming request
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header from client:', authHeader ? 'exists' : 'missing');
    
    if (!authHeader) {
      console.log('No authorization header found in request, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Call our backend API
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const endpoint = `/property-users/properties/${propertyId}/users/${userId}`;
    
    console.log('Forwarding delete request to backend at:', `${backendUrl}${endpoint}`);
    
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 0 } // Don't cache this request
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'Failed to remove user from property' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[API] Error removing user from property:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 