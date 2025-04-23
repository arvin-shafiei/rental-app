# Database Migrations

This directory contains SQL migration files for the Rental App database.

## Security Model

### Profiles Table
- The `profiles` table has Row Level Security (RLS) enabled
- Users can only view and update their own profile
- A trigger automatically creates a profile entry when a new user signs up

### All Other Tables
- All other tables should NOT use RLS for direct user access
- Data modification for all other tables should be done via service role only
- Use service role credentials for operations on these tables

## How to Apply Migrations

1. Connect to your Supabase project using the Supabase CLI or web interface
2. Run the migration files in numerical order
3. Test RLS policies to ensure they're working as expected

## Migration File Naming Convention

- Use sequential numbering: `001_`, `002_`, etc.
- Describe the purpose: `create_profiles.sql`, `add_property_table.sql`
- Example: `001_create_profiles.sql`

## Development Guidelines

1. Never store sensitive information in tables with RLS enabled for SELECT
2. Use service role for all data operations except profile management
3. Document all migrations and keep this README updated
4. Test RLS policies thoroughly before deployment 