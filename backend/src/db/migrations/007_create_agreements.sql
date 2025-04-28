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
  -- Structure: [{ 
  --   text: string, 
  --   checked: boolean,
  --   assigned_to: UUID or null,
  --   completed_by: UUID or null,
  --   completed_at: timestamp or null
  -- }]
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

-- Allow any property user (owner, tenant) to update agreements
-- This enables tenants to check off items and assign/self-assign tasks
CREATE POLICY agreements_update_policy ON agreements
  FOR UPDATE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM property_users 
      WHERE property_users.property_id = agreements.property_id 
      AND property_users.user_id = auth.uid()
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

-- Create a function to create agreement events for all property users
CREATE OR REPLACE FUNCTION create_agreement_events()
RETURNS TRIGGER AS $$
DECLARE
  property_user RECORD;
BEGIN
  -- Loop through all property users (tenants and owner)
  FOR property_user IN 
    SELECT pu.user_id 
    FROM property_users pu
    WHERE pu.property_id = NEW.property_id
  LOOP
    -- Insert event for each property user
    INSERT INTO events (
      user_id,
      event_type,
      entity_type,
      entity_id,
      title,
      description,
      is_read
    ) VALUES (
      property_user.user_id,
      'agreement_created',
      'agreement',
      NEW.id,
      'New Agreement: ' || NEW.title,
      'A new agreement has been created for a property you are associated with.',
      FALSE
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create events when a new agreement is created
CREATE TRIGGER after_agreement_created
AFTER INSERT ON agreements
FOR EACH ROW
EXECUTE FUNCTION create_agreement_events();

-- Add comments for better documentation
COMMENT ON TABLE agreements IS 'Stores agreements created by property owners and sent to tenants';
COMMENT ON COLUMN agreements.check_items IS 'JSON array of check items with structure: 
[{
  text: string, 
  checked: boolean,
  assigned_to: UUID or null,
  completed_by: UUID or null,
  completed_at: timestamp or null
}]'; 