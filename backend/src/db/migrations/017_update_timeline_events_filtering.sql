-- Update the timeline events filtering to only show events created by the current user
-- This ensures that each user only sees their own events for rent due, lease start/end, etc.

-- Update the function to filter ALL event types by user_id
CREATE OR REPLACE FUNCTION get_property_timeline_events(p_property_id UUID, p_user_id UUID)
RETURNS SETOF timeline_events
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM timeline_events
  WHERE 
    property_id = p_property_id 
    AND user_id = p_user_id;
$$;

-- Add a comment explaining the updated function
COMMENT ON FUNCTION get_property_timeline_events IS 
  'Returns timeline events for a property that belong to the specified user only. Each user only sees their own events.'; 