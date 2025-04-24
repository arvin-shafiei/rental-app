import { NextRequest, NextResponse } from 'next/server';

// PUT to update a timeline event
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    
    // Get authorization header directly from the incoming request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get the request body
    const eventData = await req.json();
    
    // Forward the request to the backend with the same authorization header
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const endpoint = `/timeline/events/${eventId}`;
    
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(eventData),
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.message || 'Failed to update timeline event' },
          { status: response.status }
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to update timeline event' },
          { status: response.status }
        );
      }
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating timeline event:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE a timeline event
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;
    
    // Get authorization header directly from the incoming request
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Forward the request to the backend with the same authorization header
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';
    const endpoint = `/timeline/events/${eventId}`;
    
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader
      },
      next: { revalidate: 0 }
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.message || 'Failed to delete timeline event' },
          { status: response.status }
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to delete timeline event' },
          { status: response.status }
        );
      }
    }
    
    // For DELETE operations, typically a 204 No Content is returned
    // We'll return a simple success message
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting timeline event:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 