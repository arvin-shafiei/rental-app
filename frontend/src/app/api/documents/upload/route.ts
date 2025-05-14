import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { cookies } from 'next/headers';

// Backend API URL from environment variables
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
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
    
    // Get query parameters from the request URL
    const url = new URL(request.url);
    const propertyId = url.searchParams.get('propertyId');
    const documentType = url.searchParams.get('documentType');
    
    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'propertyId is required' },
        { status: 400 }
      );
    }
    
    // Create a FormData instance from the request
    const formData = await request.formData();
    
    // Forward the request to the backend
    const backendFormData = new FormData();
    
    // Check if we have a document file in the form data
    const file = formData.get('document') as File;
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No document file found in the request' },
        { status: 400 }
      );
    }
    
    // First check if the user has reached their document limit
    const { data, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !data.session) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const session = data.session;
    
    // Check document limits
    const limitCheckResponse = await fetch(`/api/stripe/check-limits?feature=documents`, {
      headers: {
        'Authorization': authHeader
      }
    });
    
    const limitData = await limitCheckResponse.json();
    
    if (!limitData.allowed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Document limit reached', 
          code: 'limit_exceeded',
          currentUsage: limitData.currentUsage,
          limit: limitData.limit
        },
        { status: 403 }
      );
    }
    
    // Add the document file to the new FormData
    backendFormData.append('document', file);
    
    // Build the URL with query parameters
    let uploadUrl = `${BACKEND_URL}/api/documents/upload?propertyId=${propertyId}`;
    if (documentType) {
      uploadUrl += `&documentType=${encodeURIComponent(documentType)}`;
    }
    
    console.log(`Forwarding document upload request to: ${uploadUrl}`);
    
    // Make the request to the backend
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader // Forward the same auth header
        // Do not set Content-Type header when sending FormData
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
    
    // If upload was successful, increment the document usage counter
    if (result.success) {
      try {
        await fetch(`/api/stripe/increment-usage`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            feature: 'documents',
            userId: session.user.id
          })
        });
        console.log(`[Usage Tracking] Incremented document usage for user ${session.user.id}`);
      } catch (error) {
        console.error('[Usage Tracking] Failed to increment document usage:', error);
        // Continue execution even if tracking fails
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in document upload API route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
} 