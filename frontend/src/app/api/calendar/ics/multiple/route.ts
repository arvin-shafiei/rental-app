import { NextRequest, NextResponse } from 'next/server';

// Backend API URL - env variable already includes /api
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001/api';

export async function POST(request: NextRequest) {
  try {
    console.log('Calendar API multiple events POST request received');
    
    // Get access token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header:', authHeader);
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Missing or invalid token format' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('Empty token in authorization header:', authHeader);
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Empty token' },
        { status: 401 }
      );
    }
    
    // Get request body
    let body;
    try {
      body = await request.json();
      console.log('Request body contains data for multiple events:', body.events?.length || 0);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid request: Could not parse JSON body' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      console.error('Missing or invalid events array in request body');
      return NextResponse.json(
        { success: false, message: 'Missing or invalid events array' },
        { status: 400 }
      );
    }
    
    console.log('Using backend URL:', API_URL);
    
    // Forward the request to backend
    const response = await fetch(`${API_URL}/calendar/ics/multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).catch(error => {
      console.error('Network error posting multiple events to calendar:', error);
      throw new Error('Network error connecting to backend');
    });
    
    console.log('Backend response status:', response.status);
    
    // Check for non-OK responses before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response from backend:', errorText);
      return NextResponse.json(
        { success: false, message: `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Parse JSON response safely
    let data;
    try {
      data = await response.json();
      console.log('Backend response data:', data);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return NextResponse.json(
        { success: false, message: 'Invalid response from server' },
        { status: 500 }
      );
    }
    
    // Make sure we have valid data structure
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Invalid response format from server' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in POST /api/calendar/ics/multiple:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 