-- Create plans table to store subscription plan information
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL DEFAULT 'month',
  features JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subscriptions table to store user subscription information
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alter profiles table to add subscription_id and usage tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id),
ADD COLUMN IF NOT EXISTS usage JSONB DEFAULT '{"files": 0, "summaries": 0}';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_id_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_subscription_id_idx ON subscriptions(stripe_subscription_id);

-- Enable Row Level Security on new tables
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for plans
-- Everyone can view plans
CREATE POLICY plans_view_all ON plans
  FOR SELECT USING (true);

-- Only admins can modify plans
CREATE POLICY plans_admin_modify ON plans
  USING (auth.uid() IN (
    SELECT id FROM profiles WHERE user_role = 'admin'
  ))
  WITH CHECK (auth.uid() IN (
    SELECT id FROM profiles WHERE user_role = 'admin'
  ));

-- Create policies for subscriptions
-- Users can view their own subscriptions
CREATE POLICY subscriptions_view_own ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role and admins can modify subscriptions
CREATE POLICY subscriptions_service_full_access ON subscriptions
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert default plans
INSERT INTO plans (name, stripe_price_id, amount, features)
VALUES 
  ('Free', 'price_free', 0, '{"files": 5, "summaries": 4}'::jsonb);

-- Add this migration to the log
INSERT INTO migrations_log (name) VALUES ('021_create_stripe_tables'); 