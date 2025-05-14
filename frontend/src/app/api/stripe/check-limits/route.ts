import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { API_URL } from '@/lib/api';

/**
 * API route to check usage limits for a particular feature
 * @route GET /api/stripe/check-limits
 */
export async function GET(request: NextRequest) {
  try {
    // Extract feature from query params
    const url = new URL(request.url);
    const feature = url.searchParams.get('feature');
    
    if (!feature) {
      return NextResponse.json(
        { error: 'Missing required parameter: feature' },
        { status: 400 }
      );
    }
    
    // Get Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    // Try to get user session
    let userId: string | null = null;
    
    // First try to get session from cookie/supabase
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionData?.session?.user?.id) {
      userId = sessionData.session.user.id;
      console.log('Got user ID from supabase session:', userId);
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // If that fails, try to get user from the token
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      
      if (userData?.user?.id) {
        userId = userData.user.id;
        console.log('Got user ID from token:', userId);
      } else {
        console.error('Error getting user from token:', userError);
      }
    }
    
    if (!userId) {
      console.error('Failed to get userId from session or token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Call the backend API to check feature limits
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : sessionData?.session?.access_token;
      
    if (!token) {
      return NextResponse.json(
        { error: 'No valid authentication token found' },
        { status: 401 }
      );
    }
    
    // Call the backend API endpoint
    const response = await fetch(`${API_URL}/stripe/check-limits?feature=${encodeURIComponent(feature)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error(`Backend API error (status ${response.status}):`, errorData);
      
      // Handle 401 errors - user might need to refresh token
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // If backend is unavailable, fall back to free plan with conservative limits
      const { data: freePlan, error: planError } = await supabase
        .from('plans')
        .select('features, name')
        .eq('name', 'Free')
        .maybeSingle();
      
      if (planError || !freePlan) {
        console.error('Error getting free plan fallback:', planError);
        return NextResponse.json(
          { error: 'Failed to retrieve plan information' },
          { status: 500 }
        );
      }
      
      const featureLimit = freePlan.features?.[feature];
      console.log(`Falling back to free plan: ${feature} limit: ${featureLimit}, current usage: 0`);
      
      // Be cautious - if we can't verify limits properly, return limited usage
      return NextResponse.json({
        allowed: featureLimit === -1 || 0 < featureLimit,
        currentUsage: 0,
        limit: featureLimit === -1 ? 'unlimited' : featureLimit,
        plan: 'Free'
      });
    }
    
    const limitData = await response.json();
    console.log('Received limit data from backend:', limitData);
    
    return NextResponse.json(limitData);
  } catch (error) {
    console.error('Error checking feature limits:', error);
    return NextResponse.json(
      { error: 'Failed to check feature limits' },
      { status: 500 }
    );
  }
} 