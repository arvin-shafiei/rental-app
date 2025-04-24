# Timeline Sync Issue Fixes

## Issues Identified

1. **Missing `timeline_events` Table**
   - Error: `relation "public.timeline_events" does not exist` (code: '42P01')
   - The database is missing the timeline_events table because the migration wasn't applied properly.

2. **Property Retrieval Error**
   - Error: `JSON object requested, multiple (or no) rows returned` (code: 'PGRST116')
   - This occurs when using `.single()` on a query that returns multiple rows or no rows.
   - May indicate duplicate property records or missing properties.

## Solution Scripts

We've created three scripts to fix these issues:

### 1. `run_migrations.js`

This script applies all database migrations, including the one for the `timeline_events` table.

**Usage:**
```bash
# Install dependencies
npm install @supabase/supabase-js dotenv

# Set environment variables
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run the script
node run_migrations.js
```

### 2. `fix-property-retrieval.js`

This script checks for and fixes issues with property retrieval, particularly the PGRST116 error.

**Usage:**
```bash
# Set environment variables (if not already set)
export SUPABASE_URL=your_supabase_url
export SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Run the script
node fix-property-retrieval.js
```

## Fixing the Issues

1. First, run the migration script to create the missing timeline_events table:
   ```bash
   node run_migrations.js
   ```

2. Then, fix any property retrieval issues:
   ```bash
   node fix-property-retrieval.js
   ```

3. After running these scripts, the "Failed to sync timeline" error should be resolved.

## Technical Details

### Timeline Events Table Schema

The timeline_events table has the following structure:
- `id` (UUID): Primary key
- `property_id` (UUID): Foreign key to properties
- `user_id` (UUID): Foreign key to users
- `title` (TEXT): Event title
- `description` (TEXT): Event description
- `event_type` (TEXT): Type of event
- `start_date` (TIMESTAMP): Event start date/time
- `end_date` (TIMESTAMP): Event end date/time
- Other fields for recurrence, notifications, etc.

### Property Retrieval Fix

The property retrieval fix looks for cases where:
1. Multiple property records have the same ID (causing the PGRST116 error)
2. Keeps the most recently updated property record
3. Deletes any duplicate records

## Prevention

To prevent these issues in the future:
1. Always run migrations in the correct sequence
2. Use proper naming conventions for migration files (e.g., `001_create_profiles.sql`, `002_create_timeline_events_table.sql`)
3. Be careful with database operations that might create duplicate records
4. When using `.single()` in Supabase queries, ensure the query will return exactly one row 