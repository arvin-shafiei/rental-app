-- Migration script to move existing image data to the property_images table
-- This script will scan the storage bucket data and add entries to property_images

-- Create a temp function to migrate images
CREATE OR REPLACE FUNCTION migrate_existing_images() RETURNS void AS $$
DECLARE
    storage_object RECORD;
    path_parts TEXT[];
    user_id UUID;
    property_id UUID;
    room_name TEXT;
    filename TEXT;
BEGIN
    -- Use pg_ls_dir to get objects from storage.objects table
    FOR storage_object IN 
        SELECT * FROM storage.objects 
        WHERE bucket_id = 'room-media' 
        AND path LIKE '%/images/%'
    LOOP
        -- Parse path: userId/propertyId/images/roomName/filename
        path_parts := string_to_array(storage_object.path, '/');
        
        -- Skip if path doesn't match expected format
        IF array_length(path_parts, 1) < 4 THEN
            RAISE NOTICE 'Skipping path with unexpected format: %', storage_object.path;
            CONTINUE;
        END IF;
        
        -- Extract parts
        user_id := path_parts[1]::UUID;
        property_id := path_parts[2]::UUID;
        
        -- Set room name based on path structure
        IF array_length(path_parts, 1) >= 5 THEN
            room_name := path_parts[4];
            filename := path_parts[5];
        ELSE
            room_name := 'unspecified';
            filename := path_parts[4];
        END IF;
        
        -- Verify the property exists
        IF NOT EXISTS (SELECT 1 FROM properties WHERE id = property_id) THEN
            RAISE NOTICE 'Property not found for path: %', storage_object.path;
            CONTINUE;
        END IF;
        
        -- Insert into property_images table if not already exists
        IF NOT EXISTS (SELECT 1 FROM property_images WHERE path = storage_object.path) THEN
            INSERT INTO property_images (
                property_id,
                original_uploader_id,
                path,
                filename,
                room_name,
                content_type
            ) VALUES (
                property_id,
                user_id,
                storage_object.path,
                filename,
                room_name,
                storage_object.metadata->>'mimetype'
            );
            
            RAISE NOTICE 'Added image record for path: %', storage_object.path;
        ELSE
            RAISE NOTICE 'Image record already exists for path: %', storage_object.path;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_existing_images();

-- Drop the temporary function
DROP FUNCTION migrate_existing_images();

-- Add a note that this migration has been run
INSERT INTO public.migrations_log (name, executed_at)
VALUES ('019_migrate_existing_images', NOW()); 