import { NextRequest, NextResponse } from 'next/server';

// PUT handler to update a specific task in an agreement
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agreementId = params.id;
    
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
    
    // Parse request body
    const body = await req.json();
    const { taskIndex, action, userId } = body;
    
    if (taskIndex === undefined || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: taskIndex and action' },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend with the same authorization header
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const endpoint = `/agreements/${agreementId}/tasks`;
    
    console.log('Forwarding request to backend at:', `${backendUrl}${endpoint}`);
    console.log('Task update data:', { taskIndex, action, userId });
    
    // Make request to the backend API
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taskIndex, action, userId }),
      next: { revalidate: 0 } // Don't cache this request
    });
    
    console.log('Backend response status:', response.status);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.log('Backend error data:', errorData);
        return NextResponse.json(
          { error: errorData.message || 'Failed to update task' },
          { status: response.status }
        );
      } catch (e) {
        console.log('Could not parse error response:', e);
        return NextResponse.json(
          { error: 'Failed to update task' },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in PUT /api/agreements/[id]/tasks:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined },
      { status: 500 }
    );
  }
} 