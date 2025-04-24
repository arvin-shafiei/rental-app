# Database Migration Guide

## Issue
The application was showing the error "Failed to sync timeline" because the `timeline_events` table doesn't exist in the database. This is caused by the migration for creating this table not being properly applied.

## Solution
A script has been created to apply all database migrations, including the one for the `timeline_events` table.

## Steps to Run the Migration

1. Make sure you have the required environment variables set:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (this has admin privileges)

2. Install required dependencies:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

3. Run the migration script:
   ```bash
   node run_migrations.js
   ```

4. Check the console output to verify that all migrations were applied successfully.

## Migration Files
The migrations are stored in `backend/src/db/migrations/` and are executed in alphabetical order. The current migrations are:

- `001_create_profiles.sql`: Creates the profiles table
- `002_create_timeline_events_table.sql`: Creates the timeline_events table

## Troubleshooting

If you encounter errors with the migration:

1. Check that your Supabase environment variables are correct
2. Make sure the `exec_sql` RPC function is available in your Supabase project
3. Look at the detailed error message to identify any SQL syntax issues
4. If needed, you can manually apply the migrations through the Supabase SQL editor

## After Migration
Once the migrations have been successfully applied, the "Failed to sync timeline" error should be resolved, and the timeline functionality should work properly. 