import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the auth token from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid authorization token' },
        { status: 401 }
      );
    }
    
    // Process the form data
    const formData = await request.formData();
    const document = formData.get('document') as File;
    
    if (!document) {
      return NextResponse.json(
        { error: 'No document provided' },
        { status: 400 }
      );
    }

    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!API_URL) {
      return NextResponse.json(
        { error: 'Backend URL not configured' },
        { status: 500 }
      );
    }
    
    // Create a new FormData object to send to the backend
    const backendFormData = new FormData();
    backendFormData.append('document', document);
    
    console.log('Forwarding request to backend at:', `${API_URL}/contracts/scan`);
    
    // Call the backend API - forward the original auth header
    const response = await fetch(`${API_URL}/contracts/scan`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader // Forward the same auth header
      },
      body: backendFormData
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.log('Backend error data:', errorData);
        return NextResponse.json(
          { error: errorData.error || 'Contract scan failed' },
          { status: response.status }
        );
      } catch (e) {
        console.log('Could not parse error response:', e);
        return NextResponse.json(
          { error: 'Contract scan failed' },
          { status: response.status }
        );
      }
    }
    
    // Return the response from the backend
    const data = await response.json();
    console.log('Contract scanned successfully');
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in contract scan API route:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 