# Property Images Implementation

## Overview

Property images are stored in a way that allows sharing among all users who have access to a property. This document explains the implementation details.

## Database Schema

We use a `property_images` table to store references to images shared across all property users:

```sql
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  original_uploader_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  path TEXT NOT NULL,
  filename TEXT NOT NULL,
  room_name TEXT,
  content_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(path)
);
```

This table stores:
- The property the image belongs to
- The original uploader (for reference only)
- The path to the image in S3/Supabase storage
- Metadata about the image

## Storage Structure

Images are stored in the `room-media` bucket with a path structure:

```
properties/{propertyId}/images/{roomName}/{filename}
```

Unlike the previous implementation which tied files to a specific user (`userId/propertyId/...`), the new structure is property-centric.

## Row Level Security (RLS)

Security is implemented using Supabase Row Level Security to ensure:

1. Only users with access to a property can view its images
2. Only users with access to a property can upload images to it
3. Only the original uploader or property owner can delete images

## API Endpoints

Images are managed through these endpoints:

- `POST /upload/image` - Upload a single image
- `POST /upload/images` - Upload multiple images
- `GET /upload/property/:propertyId/images` - List images for a property
- `DELETE /upload/image` - Delete an image

## Migration

Existing images were migrated to the new structure using the migration script `019_migrate_existing_images.sql`. This script:

1. Identifies existing images in the storage
2. Creates records in the `property_images` table
3. Maintains backward compatibility with existing paths

## Frontend Implementation

The frontend continues to use the same API endpoints, which now interact with the `property_images` table instead of scanning storage buckets directly.

## Security Considerations

- Before any image operation, the backend checks if the user has access to the property
- Images are only accessible to users who are members of the property (owners or tenants)
- The original path structure is preserved for existing images, but new uploads use the property-centric structure 