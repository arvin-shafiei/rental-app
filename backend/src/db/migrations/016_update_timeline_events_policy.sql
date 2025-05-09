-- Update the RLS policy for timeline_events to include property_users
-- This allows users to see timeline events for properties they have access to
-- via the property_users junction table

-- Drop the old select policy that only allows users to see their own events
DROP POLICY IF EXISTS timeline_events_select_policy ON timeline_events;

-- Create a new select policy that allows users to see:
-- 1. Events they created (user_id = auth.uid())
-- 2. Events for properties they are associated with through property_users
CREATE POLICY timeline_events_select_policy ON timeline_events 
  FOR SELECT 
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM property_users 
      WHERE property_users.property_id = timeline_events.property_id 
      AND property_users.user_id = auth.uid()
    )
  );

-- Create a function to help filter agreement_task events
-- This ensures that agreement tasks only show up for the assigned user
CREATE OR REPLACE FUNCTION get_property_timeline_events(p_property_id UUID, p_user_id UUID)
RETURNS SETOF timeline_events
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM timeline_events
  WHERE 
    property_id = p_property_id AND (
      -- For agreement_task events, only show those assigned to this user
      (event_type = 'agreement_task' AND user_id = p_user_id) OR
      -- For all other event types, show them to everyone with property access
      (event_type != 'agreement_task')
    );
$$;

-- Add a comment explaining the function
COMMENT ON FUNCTION get_property_timeline_events IS 
  'Returns timeline events for a property, filtering agreement_task events to only show those assigned to the specified user'; 