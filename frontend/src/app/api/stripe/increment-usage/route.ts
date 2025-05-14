import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { API_URL } from '@/lib/api';

/**
 * API route to increment usage for a particular feature
 * @route POST /api/stripe/increment-usage
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { feature, userId: providedUserId } = body;
    
    if (!feature) {
      return NextResponse.json(
        { error: 'Missing required parameter: feature' },
        { status: 400 }
      );
    }
    
    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get user from token
    const { data: userData, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !userData.user) {
      console.error('Invalid token in increment-usage route:', userError);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Use provided userId if available (for admin functions), otherwise use authenticated user
    const userId = providedUserId || userData.user.id;
    
    console.log(`Incrementing ${feature} usage for user ${userId}`);
    
    // Call the backend API to increment usage
    const token = authHeader.replace('Bearer ', '');
    const response = await fetch(`${API_URL}/stripe/increment-usage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        feature
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error(`Backend API error (status ${response.status}):`, errorData);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to increment usage' },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log(`[Usage Tracking] Incremented ${feature} usage for user ${userId} to ${result.newUsage}`);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error incrementing feature usage:', error);
    return NextResponse.json(
      { error: 'Failed to increment feature usage' },
      { status: 500 }
    );
  }
} 