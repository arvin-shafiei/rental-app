import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase/client';

// GET a specific agreement by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agreementId = params.id;
    
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the agreement
    const { data, error } = await supabase
      .from('agreements')
      .select(`
        *,
        property:properties(id, name, address)
      `)
      .eq('id', agreementId)
      .single();

    if (error) {
      console.error('Error fetching agreement:', error);
      return NextResponse.json({ error: 'Failed to fetch agreement' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Verify the user has access to the property
    const { data: propertyAccess, error: propertyAccessError } = await supabase
      .from('property_users')
      .select('id')
      .eq('property_id', data.property_id)
      .eq('user_id', user.id)
      .single();

    if (propertyAccessError || !propertyAccess) {
      return NextResponse.json({ error: 'You do not have access to this agreement' }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in agreement endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT to update an agreement
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agreementId = params.id;
    
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { title, checkItems } = body;

    // Validate required fields
    if ((!title && !checkItems) || (checkItems && !Array.isArray(checkItems))) {
      return NextResponse.json({ error: 'Invalid update data' }, { status: 400 });
    }

    // Fetch the agreement to check ownership
    const { data: existingAgreement, error: fetchError } = await supabase
      .from('agreements')
      .select('id, property_id, created_by')
      .eq('id', agreementId)
      .single();

    if (fetchError || !existingAgreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Check if user is the creator or has access to the property
    const { data: propertyAccess, error: propertyAccessError } = await supabase
      .from('property_users')
      .select('id, user_role')
      .eq('property_id', existingAgreement.property_id)
      .eq('user_id', user.id)
      .single();

    // Only owner or creator can update
    const isCreator = existingAgreement.created_by === user.id;
    const isOwner = propertyAccess?.user_role === 'owner';

    if (!isCreator && !isOwner) {
      return NextResponse.json({ error: 'You do not have permission to update this agreement' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (checkItems) updateData.check_items = checkItems;

    // Update the agreement
    const { data: updatedAgreement, error: updateError } = await supabase
      .from('agreements')
      .update(updateData)
      .eq('id', agreementId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating agreement:', updateError);
      return NextResponse.json({ error: 'Failed to update agreement' }, { status: 500 });
    }

    return NextResponse.json(updatedAgreement);
  } catch (error) {
    console.error('Error in agreement endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE an agreement
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agreementId = params.id;
    
    // Authenticate user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the agreement to check ownership
    const { data: existingAgreement, error: fetchError } = await supabase
      .from('agreements')
      .select('id, property_id, created_by')
      .eq('id', agreementId)
      .single();

    if (fetchError || !existingAgreement) {
      return NextResponse.json({ error: 'Agreement not found' }, { status: 404 });
    }

    // Check if user is the creator or has access to the property
    const { data: propertyAccess, error: propertyAccessError } = await supabase
      .from('property_users')
      .select('id, user_role')
      .eq('property_id', existingAgreement.property_id)
      .eq('user_id', user.id)
      .single();

    // Only owner or creator can delete
    const isCreator = existingAgreement.created_by === user.id;
    const isOwner = propertyAccess?.user_role === 'owner';

    if (!isCreator && !isOwner) {
      return NextResponse.json({ error: 'You do not have permission to delete this agreement' }, { status: 403 });
    }

    // Delete the agreement
    const { error: deleteError } = await supabase
      .from('agreements')
      .delete()
      .eq('id', agreementId);

    if (deleteError) {
      console.error('Error deleting agreement:', deleteError);
      return NextResponse.json({ error: 'Failed to delete agreement' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Agreement deleted successfully' });
  } catch (error) {
    console.error('Error in agreement endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 