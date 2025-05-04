-- Create deposit_requests table for tracking deposit requests
CREATE TABLE IF NOT EXISTS deposit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Request details
  message TEXT NOT NULL,
  image_ids UUID[] DEFAULT '{}',
  status TEXT CHECK (status IN ('draft', 'sent', 'replied', 'completed')) DEFAULT 'sent',
  
  -- Email tracking
  email_id TEXT,
  landlord_email TEXT
);

-- Add indexes for better query performance
CREATE INDEX deposit_requests_property_id_idx ON deposit_requests(property_id);
CREATE INDEX deposit_requests_user_id_idx ON deposit_requests(user_id);
CREATE INDEX deposit_requests_status_idx ON deposit_requests(status);

-- Enable Row Level Security
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own requests
CREATE POLICY deposit_requests_select_own ON deposit_requests 
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create requests for properties they have access to
CREATE POLICY deposit_requests_insert_own ON deposit_requests 
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
CREATE POLICY deposit_requests_service_role_all ON deposit_requests
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comments for clarity
COMMENT ON TABLE deposit_requests IS 'Tracks deposit requests sent to landlords';
COMMENT ON COLUMN deposit_requests.image_ids IS 'Array of image IDs attached to the request';
COMMENT ON COLUMN deposit_requests.status IS 'Status of the request: draft, sent, replied, or completed'; 