import { NextRequest, NextResponse } from 'next/server';

// Backend API URL from environment variables
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
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
    
    // Join the path segments to reconstruct the full document path
    const documentPath = params.path.join('/');
    
    console.log(`Deleting document at path: ${documentPath}`);
    
    // Call backend API to delete the document
    const response = await fetch(`${BACKEND_URL}/api/documents/${documentPath}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader, // Forward the same auth header
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to delete document: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          success: false, 
          error: errorData.message || `Failed to delete document: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in delete document API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 