CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_all_day BOOLEAN DEFAULT FALSE,
  recurrence_type TEXT DEFAULT 'none',
  recurrence_end_date TIMESTAMP WITH TIME ZONE,
  notification_days_before INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for faster queries
CREATE INDEX idx_timeline_events_property_id ON timeline_events(property_id);
CREATE INDEX idx_timeline_events_user_id ON timeline_events(user_id);
CREATE INDEX idx_timeline_events_start_date ON timeline_events(start_date);
CREATE INDEX idx_timeline_events_event_type ON timeline_events(event_type);

-- Enable Row Level Security
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read only their own events
CREATE POLICY timeline_events_select_policy ON timeline_events 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy for service role to read any events (needed for admin functions)
CREATE POLICY timeline_events_service_role_select_policy ON timeline_events 
  FOR SELECT 
  TO service_role 
  USING (true);

-- Create policy for service role to insert events
CREATE POLICY timeline_events_service_role_insert_policy ON timeline_events 
  FOR INSERT 
  TO service_role 
  WITH CHECK (true);

-- Create policy for service role to update events
CREATE POLICY timeline_events_service_role_update_policy ON timeline_events 
  FOR UPDATE 
  TO service_role 
  USING (true);

-- Create policy for service role to delete events
CREATE POLICY timeline_events_service_role_delete_policy ON timeline_events 
  FOR DELETE 
  TO service_role 
  USING (true);

-- Deny all other operations for non-service roles
-- This means regular authenticated users can only read their own data,
-- and all modifications must go through the backend using the service role 