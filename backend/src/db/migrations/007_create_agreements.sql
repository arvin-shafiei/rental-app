-- Create agreements table and related functions
-- This table stores agreements created by property owners or managers
-- and sent to property tenants

-- Create the agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Store checklist items as JSONB for flexibility
  -- Structure: [{ text: string, checked: boolean }]
  check_items JSONB NOT NULL DEFAULT '[]'::JSONB
);

-- Create indexes for faster lookups
CREATE INDEX agreements_property_id_idx ON agreements(property_id);
CREATE INDEX agreements_created_by_idx ON agreements(created_by);

-- Enable Row Level Security
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_agreements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agreements_updated_at
BEFORE UPDATE ON agreements
FOR EACH ROW EXECUTE FUNCTION update_agreements_updated_at();

-- RLS Policies for agreements
-- Users can view agreements if they are:
-- 1. The creator of the agreement
-- 2. A property owner
-- 3. A tenant of the property
CREATE POLICY agreements_view_policy ON agreements
  FOR SELECT USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM property_users 
      WHERE property_users.property_id = agreements.property_id 
      AND property_users.user_id = auth.uid()
    )
  );

-- Only property owners or the creator can insert agreements
CREATE POLICY agreements_insert_policy ON agreements
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM property_users 
      WHERE property_users.property_id = agreements.property_id 
      AND property_users.user_id = auth.uid()
      AND property_users.user_role = 'owner'
    )
  );

-- Only property owners or the creator can update agreements
CREATE POLICY agreements_update_policy ON agreements
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM property_users 
      WHERE property_users.property_id = agreements.property_id 
      AND property_users.user_id = auth.uid()
      AND property_users.user_role = 'owner'
    )
  );

-- Only property owners or the creator can delete agreements
CREATE POLICY agreements_delete_policy ON agreements
  FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM property_users 
      WHERE property_users.property_id = agreements.property_id 
      AND property_users.user_id = auth.uid()
      AND property_users.user_role = 'owner'
    )
  );

-- Add comments for better documentation
COMMENT ON TABLE agreements IS 'Stores agreements created by property owners and sent to tenants';
COMMENT ON COLUMN agreements.check_items IS 'JSON array of checkitems with text and checked status'; 