import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { API_URL } from '@/lib/api';

// Forward API requests to the backend
export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('propertyId');
    
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify the token by getting user session
    const { data: tokenData, error: tokenError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (tokenError || !tokenData.user) {
      console.error('Invalid token in repair-requests route:', tokenError);
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Forward the request to the backend
    const response = await fetch(`${API_URL}/repair-requests?propertyId=${propertyId}`, {
      headers: {
        'Authorization': authHeader
      }
    });
    
    if (!response.ok) {
      const statusCode = response.status;
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { error: errorData.error || 'Request failed' },
          { status: statusCode }
        );
      } catch (e) {
        return NextResponse.json(
          { error: 'Request failed' },
          { status: statusCode }
        );
      }
    }
    
    // Return the response from the backend
    return NextResponse.json(await response.json());
  } catch (error) {
    console.error('Error in repair-requests API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('propertyId');
    
    // Get authorization header
    let authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Verify the token by getting user session
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !userData.user) {
      console.error('Invalid token in repair-requests route:', userError);
      
      // Try to refresh the token if possible
      const { data: refreshData } = await supabase.auth.refreshSession();
      if (!refreshData.session) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      // Retry with refreshed token
      authHeader = `Bearer ${refreshData.session.access_token}`;
      const retryUserData = await supabase.auth.getUser(refreshData.session.access_token);
      
      if (retryUserData.error || !retryUserData.data.user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      // If we get here, use the refreshed token and user data
      userData.user = retryUserData.data.user;
    }
    
    const userId = userData.user.id;
    
    // Get request body
    const body = await req.json();
    
    // First check if the user has reached their email limit
    const origin = new URL(req.url).origin;
    const limitCheckResponse = await fetch(`${origin}/api/stripe/check-limits?feature=emails`, {
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
          error: 'Email limit reached', 
          code: 'limit_exceeded',
          currentUsage: limitData.currentUsage,
          limit: limitData.limit
        },
        { status: 403 }
      );
    }
    
    // Forward the request to the backend
    const response = await fetch(`${API_URL}/repair-requests?propertyId=${propertyId}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const statusCode = response.status;
      try {
        const errorData = await response.json();
        return NextResponse.json(
          { success: false, error: errorData.error || 'Request failed' },
          { status: statusCode }
        );
      } catch (e) {
        return NextResponse.json(
          { success: false, error: 'Request failed' },
          { status: statusCode }
        );
      }
    }
    
    const result = await response.json();
    
    // If email was sent successfully, increment the email usage counter
    if (result.success) {
      try {
        await fetch(`${origin}/api/stripe/increment-usage`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            feature: 'emails',
            userId: userId
          })
        });
        console.log(`[Usage Tracking] Incremented email usage for user ${userId}`);
      } catch (error) {
        console.error('[Usage Tracking] Failed to increment email usage:', error);
        // Continue execution even if tracking fails
      }
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in repair-requests API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 