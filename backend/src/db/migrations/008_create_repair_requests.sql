-- Create repair_requests table for tracking repair requests
CREATE TABLE IF NOT EXISTS repair_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Request details
  message TEXT NOT NULL,
  image_ids UUID[] DEFAULT '{}',
  status TEXT CHECK (status IN ('draft', 'sent', 'replied', 'in_progress', 'completed')) DEFAULT 'sent',
  
  -- Email tracking
  email_id TEXT,
  landlord_email TEXT
);

-- Add indexes for better query performance
CREATE INDEX repair_requests_property_id_idx ON repair_requests(property_id);
CREATE INDEX repair_requests_user_id_idx ON repair_requests(user_id);
CREATE INDEX repair_requests_status_idx ON repair_requests(status);

-- Enable Row Level Security
ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own requests
CREATE POLICY repair_requests_select_own ON repair_requests 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create requests for properties they have access to
CREATE POLICY repair_requests_insert_own ON repair_requests 
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = property_id AND 
      (properties.user_id = auth.uid() OR 
       EXISTS (
         SELECT 1 FROM property_users 
         WHERE property_users.property_id = properties.id AND 
         property_users.user_id = auth.uid()
       ))
    )
  );

-- Service role has full access
CREATE POLICY repair_requests_service_role_all ON repair_requests
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create function to handle text[] image references (fallback)
CREATE OR REPLACE FUNCTION create_repair_request_with_text_images(
  p_property_id UUID,
  p_user_id UUID,
  p_message TEXT,
  p_image_refs TEXT[],
  p_status TEXT DEFAULT 'sent'
) RETURNS SETOF repair_requests AS $$
BEGIN
  RETURN QUERY
  INSERT INTO repair_requests (property_id, user_id, message, image_ids, status)
  VALUES (p_property_id, p_user_id, p_message, '{}', p_status)
  RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- Add comments for clarity
COMMENT ON TABLE repair_requests IS 'Tracks repair requests sent to landlords';
COMMENT ON FUNCTION create_repair_request_with_text_images IS 'Helper function to create repair requests with text references as a fallback'; 