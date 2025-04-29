-- Add UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create contract_summaries table
CREATE TABLE IF NOT EXISTS contract_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  summary JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_contract_summaries_created_at ON contract_summaries(created_at);

-- Sample query to retrieve recent summaries
-- SELECT id, summary, created_at FROM contract_summaries ORDER BY created_at DESC LIMIT 10;

-- Sample query to retrieve a specific summary
-- SELECT id, summary, created_at FROM contract_summaries WHERE id = '00000000-0000-0000-0000-000000000000';

-- Sample query to count summaries by date range
-- SELECT COUNT(*) FROM contract_summaries WHERE created_at BETWEEN '2023-01-01' AND '2023-12-31'; 