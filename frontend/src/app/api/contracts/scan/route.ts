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
    
    // Check content type to determine if it's form data or JSON
    const contentType = request.headers.get('content-type') || '';
    let documentPath: string | null = null;
    let document: File | null = null;
    
    if (contentType.includes('multipart/form-data')) {
      // Process form data for file uploads
      const formData = await request.formData();
      document = formData.get('document') as File;
      
      if (!document) {
        return NextResponse.json(
          { error: 'No document provided' },
          { status: 400 }
        );
      }
    } else {
      // Process JSON for document path
      const body = await request.json();
      documentPath = body.documentPath;
      
      if (!documentPath) {
        return NextResponse.json(
          { error: 'No document path provided' },
          { status: 400 }
        );
      }
      
      console.log('Received document path for scanning:', documentPath);
    }

    const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!API_URL) {
      return NextResponse.json(
        { error: 'Backend URL not configured' },
        { status: 500 }
      );
    }
    
    let response;
    
    if (document) {
      // For file uploads, forward as form data
      const backendFormData = new FormData();
      backendFormData.append('document', document);
      
      console.log('Forwarding file upload to backend at:', `${API_URL}/contracts/scan`);
      
      response = await fetch(`${API_URL}/contracts/scan`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader
        },
        body: backendFormData
      });
    } else if (documentPath) {
      // For document paths, forward as JSON
      console.log('Forwarding document path to backend at:', `${API_URL}/contracts/scan`);
      console.log('Document path value:', documentPath);
      
      response = await fetch(`${API_URL}/contracts/scan`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documentPath })
      });
    } else {
      // Should never happen due to earlier checks
      return NextResponse.json(
        { error: 'No document provided' },
        { status: 400 }
      );
    }
    
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