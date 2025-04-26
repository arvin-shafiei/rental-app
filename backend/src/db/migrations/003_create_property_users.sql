-- Schema for property_users junction table with Row Level Security
-- Enables many-to-many relationship between properties and users

CREATE TABLE IF NOT EXISTS property_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Role (simplified to tenant for now but designed for extension)
  user_role TEXT CHECK (user_role IN ('owner', 'tenant')) NOT NULL,
  
  -- Prevent duplicate user-property combinations
  UNIQUE(property_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX property_users_property_id_idx ON property_users(property_id);
CREATE INDEX property_users_user_id_idx ON property_users(user_id);

-- Enable Row Level Security
ALTER TABLE property_users ENABLE ROW LEVEL SECURITY;

-- Update properties view policy to include users in the property_users table
DROP POLICY IF EXISTS properties_view_own ON properties;
CREATE POLICY properties_view_own ON properties 
  FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM property_users 
      WHERE property_users.property_id = properties.id 
      AND property_users.user_id = auth.uid()
    )
  );

-- Create policies for property_users

-- Users can view property_users entries where they are either:
-- 1. The property owner
-- 2. A user associated with the property
CREATE POLICY property_users_view_policy ON property_users
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_users.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- Only property owners can add users to their properties
CREATE POLICY property_users_insert_policy ON property_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_users.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- Only property owners can update user associations
CREATE POLICY property_users_update_policy ON property_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_users.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- Only property owners can remove users from their properties
CREATE POLICY property_users_delete_policy ON property_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_users.property_id 
      AND properties.user_id = auth.uid()
    )
  );

-- Service role has full access
CREATE POLICY property_users_service_full_access ON property_users
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add property owner automatically when property is created
CREATE OR REPLACE FUNCTION public.add_property_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.property_users (property_id, user_id, user_role)
  VALUES (NEW.id, NEW.user_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add owner to property_users when property is created
CREATE TRIGGER on_property_created
  AFTER INSERT ON properties
  FOR EACH ROW EXECUTE FUNCTION public.add_property_owner();

-- Comment for clarity
COMMENT ON TABLE property_users IS 'Junction table linking users to properties with RLS enabled. Property owners can manage users, and users can view properties they are associated with.';
