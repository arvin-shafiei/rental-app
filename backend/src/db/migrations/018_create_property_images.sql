-- Migration for property_images table
-- Creates a table to store property images that are shared among all property users

CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  original_uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  filename TEXT NOT NULL,
  room_name TEXT,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint on path to prevent duplicates
  UNIQUE(path)
);

-- Create index for faster lookups
CREATE INDEX property_images_property_id_idx ON property_images(property_id);
CREATE INDEX property_images_uploader_id_idx ON property_images(original_uploader_id);

-- Enable Row Level Security
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Create policies for property_images

-- Users can view property_images entries if they are:
-- 1. The property owner
-- 2. A user associated with the property
CREATE POLICY property_images_view_policy ON property_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM property_users
      WHERE property_users.property_id = property_images.property_id 
      AND property_users.user_id = auth.uid()
    )
  );

-- Users can insert images for properties they have access to
CREATE POLICY property_images_insert_policy ON property_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM property_users
      WHERE property_users.property_id = property_images.property_id 
      AND property_users.user_id = auth.uid()
    )
  );

-- Only the original uploader or property owner can delete images
CREATE POLICY property_images_delete_policy ON property_images
  FOR DELETE USING (
    original_uploader_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.user_id = auth.uid()
    )
  );

-- Service role has full access
CREATE POLICY property_images_service_full_access ON property_images
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add update_timestamp function if it doesn't exist already
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update timestamp on record update
CREATE TRIGGER update_property_images_timestamp
BEFORE UPDATE ON property_images
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Comment for clarity
COMMENT ON TABLE property_images IS 'Table storing property images with RLS enabled. Images are shared among all property users.'; 