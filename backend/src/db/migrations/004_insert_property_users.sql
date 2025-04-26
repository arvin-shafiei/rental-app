-- Migration to populate property_users table with existing property owners
-- Sets up each property owner as 'owner' in the junction table

-- Insert existing property owners into property_users table
-- Skip any that might already exist due to the trigger
INSERT INTO property_users (property_id, user_id, user_role)
SELECT 
  p.id as property_id, 
  p.user_id, 
  'owner' as user_role
FROM 
  properties p
WHERE 
  NOT EXISTS (
    SELECT 1 FROM property_users pu 
    WHERE pu.property_id = p.id AND pu.user_id = p.user_id
  );

-- Comment for clarity
COMMENT ON TABLE property_users IS 'Junction table linking users to properties with RLS enabled. Property owners have role "owner" and can manage properties, while tenants have role "tenant" and can only view properties.';
