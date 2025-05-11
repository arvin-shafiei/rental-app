-- Migration to update storage bucket policies for property images
-- This migration ensures that images are accessible to authenticated users with proper property access

-- First, drop any existing policies on the bucket
BEGIN;

-- Create a policy to allow reading images for users with property access
DO $$
BEGIN
    -- Drop the policy if it exists (to prevent errors on re-running the migration)
    BEGIN
        EXECUTE format('DROP POLICY IF EXISTS allow_property_image_access ON storage.objects');
    EXCEPTION WHEN OTHERS THEN
        -- Policy doesn't exist, continue
    END;

    -- Create the new policy
    EXECUTE format('
        CREATE POLICY allow_property_image_access ON storage.objects
        FOR SELECT
        USING (
            bucket_id = ''room-media'' AND
            (
                -- Allow access if the user has access to the property through property_users
                EXISTS (
                    SELECT 1 FROM property_images pi
                    JOIN property_users pu ON pi.property_id = pu.property_id
                    WHERE pi.path = name AND pu.user_id = auth.uid()
                )
                OR
                -- Or the user is the property owner
                EXISTS (
                    SELECT 1 FROM property_images pi
                    JOIN properties p ON pi.property_id = p.id
                    WHERE pi.path = name AND p.user_id = auth.uid()
                )
                OR
                -- Or the user is the one who originally uploaded the image
                EXISTS (
                    SELECT 1 FROM property_images pi
                    WHERE pi.path = name AND pi.original_uploader_id = auth.uid()
                )
            )
        )
    ');
END$$;

-- Also create a "public row level security exemption" policy for the service role
DO $$
BEGIN
    BEGIN
        EXECUTE format('DROP POLICY IF EXISTS service_role_all_access ON storage.objects');
    EXCEPTION WHEN OTHERS THEN
        -- Policy doesn't exist, continue
    END;

    EXECUTE format('
        CREATE POLICY service_role_all_access ON storage.objects
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    ');
END$$;

-- Make sure public access is available for sharing images
DO $$
BEGIN
    -- Update the bucket configuration to allow public access
    UPDATE storage.buckets
    SET public = true
    WHERE name = 'room-media';
    
    -- Verify the update
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'room-media' AND public = true) THEN
        RAISE EXCEPTION 'Failed to update bucket public access setting';
    END IF;
END$$;

COMMIT; 