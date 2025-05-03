-- Schema for profiles table with Row Level Security
-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table with RLS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- User information
  display_name TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  
  -- Role and preferences
  user_role TEXT CHECK (user_role IN ('user', 'admin')) DEFAULT 'user',
  
  -- Preferences
  preferred_contact_method TEXT DEFAULT 'email',
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  
  -- App settings
  settings JSONB DEFAULT '{}'::jsonb
);

-- Properties table - users can have multiple properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Property information
  name TEXT NOT NULL,
  emoji TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Property details
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  county TEXT,
  postcode TEXT NOT NULL,
  country TEXT DEFAULT 'United Kingdom',
  
  -- Property type and details
  property_type TEXT,
  landlord_email TEXT,
  rent_amount DECIMAL(10, 2),
  deposit_amount DECIMAL(10, 2),
  lease_start_date DATE,
  lease_end_date DATE,
  
  -- Additional data stored as JSON
  property_details JSONB DEFAULT '{}'::jsonb
);

-- Create index on user_id for faster lookups
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX properties_user_id_idx ON properties(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
-- 1. Users can view their own profile only
CREATE POLICY profiles_view_own ON profiles 
  FOR SELECT USING (auth.uid() = id);

-- 2. Service role has full access to profiles
CREATE POLICY profiles_service_full_access ON profiles
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for properties
-- 1. Users can view their own properties only
CREATE POLICY properties_view_own ON properties 
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Service role has full access to properties
CREATE POLICY properties_service_full_access ON properties
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create or replace function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Comment for clarity that this is for RLS use only
COMMENT ON TABLE profiles IS 'User profiles with RLS enabled - users can only view their own profile. Only service role can modify profiles.';
COMMENT ON TABLE properties IS 'User properties with RLS enabled - users can only view their own properties. Only service role can modify properties.'; 