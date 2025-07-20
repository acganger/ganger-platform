-- Create LLM Usage Tracking Table
-- Tracks AI model usage for billing and monitoring

CREATE TABLE IF NOT EXISTS llm_usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost DECIMAL(10, 6) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_llm_usage_user_id ON llm_usage_tracking(user_id);
CREATE INDEX idx_llm_usage_created_at ON llm_usage_tracking(created_at);
CREATE INDEX idx_llm_usage_user_email ON llm_usage_tracking(user_email);

-- Enable RLS
ALTER TABLE llm_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own usage
CREATE POLICY "Users can view own usage" ON llm_usage_tracking
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: System can insert usage records
CREATE POLICY "System can insert usage" ON llm_usage_tracking
  FOR INSERT
  WITH CHECK (true);

-- Create a view for usage summaries
CREATE OR REPLACE VIEW llm_usage_summary AS
SELECT 
  user_email,
  DATE_TRUNC('day', created_at) as usage_date,
  COUNT(*) as request_count,
  SUM(tokens_used) as total_tokens,
  SUM(cost) as total_cost,
  ARRAY_AGG(DISTINCT model) as models_used
FROM llm_usage_tracking
GROUP BY user_email, DATE_TRUNC('day', created_at);

-- Grant permissions
GRANT SELECT ON llm_usage_tracking TO authenticated;
GRANT SELECT ON llm_usage_summary TO authenticated;