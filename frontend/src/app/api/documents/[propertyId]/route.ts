import { NextRequest, NextResponse } from 'next/server';

// Backend API URL from environment variables
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    // Get authorization header directly from the incoming request
    const authHeader = request.headers.get('authorization');
    console.log('Authorization header from client:', authHeader ? 'exists' : 'missing');
    
    if (!authHeader) {
      console.log('No authorization header found in request, returning 401');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const propertyId = params.propertyId;
    
    console.log(`Fetching documents for property ${propertyId}`);
    
    // Call backend API to get property documents - matching the '/property/:propertyId' route in backend
    // The frontend client calls /documents/${propertyId}, but we need to call the correct backend route
    const response = await fetch(`${BACKEND_URL}/api/documents/property/${propertyId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader, // Forward the same auth header
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch documents: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || `Failed to fetch documents: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in documents API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 