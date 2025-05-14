import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { API_URL } from '@/lib/api';

export const dynamic = 'force-dynamic';

// POST image handler
export async function POST(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('propertyId');
    const roomName = url.searchParams.get('roomName');
    
    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'Property ID is required' },
        { status: 400 }
      );
    }
    
    // Get authorization header
    let authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user from token
    let { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !userData.user) {
      console.error('Invalid token in upload/image route:', userError);
      
      // Try to refresh the token
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (refreshData?.session?.access_token) {
        authHeader = `Bearer ${refreshData.session.access_token}`;
        const retryUserData = await supabase.auth.getUser(refreshData.session.access_token);
        
        if (retryUserData.error || !retryUserData.data.user) {
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          );
        }
        
        // Update user data with refreshed session data
        userData = retryUserData.data;
      } else {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
    }
    
    const userId = userData.user.id;
    
    // Check image limits
    const origin = new URL(req.url).origin;
    const limitCheckResponse = await fetch(`${origin}/api/stripe/check-limits?feature=images`, {
      headers: {
        'Authorization': authHeader
      }
    });

    if (!limitCheckResponse.ok) {
      console.error(`Check limit failed with status: ${limitCheckResponse.status}`);
      if (limitCheckResponse.status === 401) {
        // For 401 errors, immediately return unauthorized
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // For other errors, try to proceed but with caution
      return NextResponse.json(
        { success: false, error: 'Could not check usage limits' },
        { status: 500 }
      );
    }

    const limitData = await limitCheckResponse.json();
    
    if (!limitData.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Image limit reached', 
          code: 'limit_exceeded',
          currentUsage: limitData.currentUsage,
          limit: limitData.limit
        },
        { status: 403 }
      );
    }
    
    // Get the image file from the request
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'No image file found in the request' },
        { status: 400 }
      );
    }
    
    // Forward the request to the backend with the same authorization header
    let endpoint = `/upload/image?propertyId=${propertyId}`;
    
    if (roomName) {
      endpoint += `&roomName=${encodeURIComponent(roomName)}`;
    }
    
    console.log('Forwarding upload request to backend at:', `${API_URL}${endpoint}`);
    
    // Create a new FormData for the backend request
    const backendFormData = new FormData();
    backendFormData.append('image', imageFile);
    
    // Forward the request to the backend API
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: backendFormData
    });
    
    if (!response.ok) {
      console.error(`Upload failed: ${response.status} ${response.statusText}`);
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { success: false, error: errorData.message || 'Upload failed' },
          { status: response.status }
        );
      } catch (e) {
        return NextResponse.json(
          { success: false, error: `Upload failed: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
    }
    
    const result = await response.json();
    
    // If the backend hasn't already tracked usage, do it here as a fallback
    // This is needed only during the transition period
    try {
      const usageTrackResponse = await fetch(`${origin}/api/stripe/increment-usage`, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feature: 'images',
          userId: userId
        })
      });
      
      if (usageTrackResponse.ok) {
        console.log(`[Frontend Usage Tracking] Incremented image usage for user ${userId}`);
      }
    } catch (trackError) {
      // Just log tracking errors, don't fail the upload
      console.error('[Frontend Usage Tracking] Failed:', trackError);
    }
    
    console.log(`[Usage Tracking] Backend is tracking usage for user ${userId}`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in image upload API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}

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
    
    // Verify token is valid
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !userData.user) {
      console.error('Invalid token in upload/image DELETE route:', userError);
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
    const endpoint = `/upload/image?propertyId=${propertyId}`;
    
    console.log('Forwarding delete request to backend at:', `${API_URL}${endpoint}`);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
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