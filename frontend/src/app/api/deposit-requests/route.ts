import { NextRequest, NextResponse } from 'next/server';

// Get the backend API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

if (!API_URL) {
  console.error('Backend API URL is not defined in environment variables');
}

export async function GET(req: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = req.headers.get('authorization');
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
    
    // Extract the property ID from the query parameters
    const propertyId = req.nextUrl.searchParams.get('propertyId');
    
    if (!propertyId) {
      return NextResponse.json(
        { success: false, message: 'Property ID is required' },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend with the authorization header
    const backendUrl = `${API_URL}/deposit-requests?propertyId=${propertyId}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Get the response data
    const data = await response.json();
    
    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in deposit-requests API route (GET):', error);
    
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get access token from Authorization header
    const authHeader = req.headers.get('authorization');
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
    
    // Extract the property ID from the query parameters
    const propertyId = req.nextUrl.searchParams.get('propertyId');
    
    if (!propertyId) {
      return NextResponse.json(
        { success: false, message: 'Property ID is required' },
        { status: 400 }
      );
    }
    
    // Get the request body
    const body = await req.json();
    console.log('Request Body:', JSON.stringify(body, null, 2));
    
    // Forward the request to the backend with the authorization header
    const backendUrl = `${API_URL}/deposit-requests?propertyId=${propertyId}`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // Log response status
    console.log('Backend response status:', response.status);
    
    // Get the response data
    const data = await response.json();
    
    // Return the response from the backend
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error in deposit-requests API route (POST):', error);
    
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 