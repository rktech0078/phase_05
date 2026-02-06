-- Migration 003: Create audit logs table
-- Description: Create table for comprehensive audit trail of all task operations

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'completed', 'deleted')),
  changes JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  correlation_id TEXT
);

-- Create indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_audit_logs_task ON audit_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation ON audit_logs(correlation_id) WHERE correlation_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all task operations';
COMMENT ON COLUMN audit_logs.task_id IS 'Associated task ID (nullable for deleted tasks)';
COMMENT ON COLUMN audit_logs.action IS 'Action type: created, updated, completed, or deleted';
COMMENT ON COLUMN audit_logs.changes IS 'JSON object with change details (old → new values)';
COMMENT ON COLUMN audit_logs.correlation_id IS 'Correlation ID for distributed tracing';
