import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

// GET handler for agreements
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const url = new URL(req.url);
    const propertyId = url.searchParams.get('propertyId');

    // Prepare query
    let query = supabase
      .from('agreements')
      .select(`
        *,
        property:properties(id, name, address)
      `);

    // Filter by property if provided
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching agreements:', error);
      return NextResponse.json({ error: 'Failed to fetch agreements' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in agreements endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating a new agreement
export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { title, propertyId, checkItems } = body;

    // Validate required fields
    if (!title || !propertyId || !checkItems || !Array.isArray(checkItems)) {
      return NextResponse.json(
        { error: 'Missing required fields: title, propertyId, and checkItems' },
        { status: 400 }
      );
    }

    // Verify the user has access to the property
    const { data: propertyAccess, error: propertyAccessError } = await supabase
      .from('property_users')
      .select('id')
      .eq('property_id', propertyId)
      .eq('user_id', user.id)
      .single();

    if (propertyAccessError || !propertyAccess) {
      return NextResponse.json({ error: 'You do not have access to this property' }, { status: 403 });
    }

    // Insert agreement
    const { data: agreement, error: agreementError } = await supabase
      .from('agreements')
      .insert({
        title,
        property_id: propertyId,
        created_by: user.id,
        check_items: checkItems
      })
      .select()
      .single();

    if (agreementError) {
      console.error('Error creating agreement:', agreementError);
      return NextResponse.json({ error: 'Failed to create agreement' }, { status: 500 });
    }

    return NextResponse.json(agreement);
  } catch (error) {
    console.error('Error in agreements endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 