import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { API_URL } from '@/lib/api';

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
    
    // Verify the token by getting user info
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !userData.user) {
      console.error('Invalid token in contracts/scan route:', userError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = userData.user.id;
    
    // Check if the user has reached their summary limit
    const origin = new URL(request.url).origin;
    const limitCheckResponse = await fetch(`${origin}/api/stripe/check-limits?feature=summaries`, {
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
      
      // For other errors, be cautious and don't allow the operation
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
          error: 'Summary limit reached', 
          code: 'limit_exceeded',
          currentUsage: limitData.currentUsage,
          limit: limitData.limit
        },
        { status: 403 }
      );
    }
    
    // Check content type to determine if it's form data or JSON
    const contentType = request.headers.get('content-type') || '';
    let documentPath: string | null = null;
    let document: File | null = null;
    let providedUserId: string | null = userId;
    
    if (contentType.includes('multipart/form-data')) {
      // Process form data for file uploads
      const formData = await request.formData();
      document = formData.get('document') as File;
      // Use provided user ID if available, otherwise use the session user ID
      const formUserId = formData.get('userId') as string;
      if (formUserId) providedUserId = formUserId;
      
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
      // Use provided user ID if available, otherwise use the session user ID
      if (body.userId) providedUserId = body.userId;
      
      if (!documentPath) {
        return NextResponse.json(
          { error: 'No document path provided' },
          { status: 400 }
        );
      }
      
      console.log('Received document path for scanning:', documentPath);
    }

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
      if (providedUserId) {
        backendFormData.append('userId', providedUserId);
      }
      
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
        body: JSON.stringify({ documentPath, userId: providedUserId })
      });
    } else {
      // Should never happen due to earlier checks
      return NextResponse.json(
        { error: 'No document provided' },
        { status: 400 }
      );
    }
    
    if (!response.ok) {
      const statusCode = response.status;
      try {
        const errorData = await response.json();
        console.log('Backend error data:', errorData);
        return NextResponse.json(
          { error: errorData.error || 'Contract scan failed' },
          { status: statusCode }
        );
      } catch (e) {
        console.log('Could not parse error response:', e);
        return NextResponse.json(
          { error: 'Contract scan failed' },
          { status: statusCode }
        );
      }
    }
    
    // Return the response from the backend
    const responseData = await response.json();
    console.log('Contract scanned successfully');
    
    // Increment the summary usage counter
    if (responseData.success !== false) {
      try {
        await fetch(`${origin}/api/stripe/increment-usage`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            feature: 'summaries',
            userId: providedUserId
          })
        });
        console.log(`[Usage Tracking] Incremented summary usage for user ${providedUserId}`);
      } catch (error) {
        console.error('[Usage Tracking] Failed to increment summary usage:', error);
        // Continue execution even if tracking fails
      }
    }
    
    return NextResponse.json(responseData);
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