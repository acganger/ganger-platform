-- Test SQL syntax validation
-- This should execute without errors

BEGIN;

-- Simple test table
CREATE TABLE IF NOT EXISTS test_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test insert
INSERT INTO test_table (name) VALUES ('test');

-- Cleanup
DROP TABLE test_table;

COMMIT;

SELECT 'SQL syntax test passed!' as result;