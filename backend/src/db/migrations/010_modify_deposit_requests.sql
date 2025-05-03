-- Add a new column for storing text-based image references
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS image_refs TEXT[] DEFAULT '{}';

-- Create a stored procedure to insert deposit requests with text image references
CREATE OR REPLACE FUNCTION create_deposit_request_with_text_images(
  p_property_id UUID, 
  p_user_id UUID, 
  p_message TEXT, 
  p_image_refs TEXT[], 
  p_status TEXT DEFAULT 'sent'
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  -- Insert the new deposit request
  INSERT INTO deposit_requests (
    property_id, 
    user_id, 
    message,
    image_refs,  -- Use text array instead of UUID array
    status
  ) VALUES (
    p_property_id,
    p_user_id,
    p_message,
    p_image_refs,
    p_status
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql; 