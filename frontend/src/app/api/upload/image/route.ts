import { NextRequest, NextResponse } from 'next/server';

// DELETE image handler
export async function DELETE(req: NextRequest) {
  try {
    // Get the propertyId from query parameters
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('propertyId');
    
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }
    
    // Get authorization header directly from the incoming request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the image path from request body
    const requestBody = await req.json();
    const { imagePath } = requestBody;
    
    if (!imagePath) {
      return NextResponse.json(
        { error: 'Image path is required' },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend with the same authorization header
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const endpoint = `/upload/image?propertyId=${propertyId}`;
    
    console.log('Forwarding delete request to backend at:', `${backendUrl}${endpoint}`);
    
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imagePath }),
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.message || 'Failed to delete image' },
          { status: response.status }
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to delete image' },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    console.log('Image deleted successfully');
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 