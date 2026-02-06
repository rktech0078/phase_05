-- Migration 002: Create reminders table
-- Description: Create table for reminder notifications with retry logic

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0 AND retry_count <= 3),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(reminder_time, delivery_status) WHERE delivery_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_reminders_task ON reminders(task_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);

-- Add comments for documentation
COMMENT ON TABLE reminders IS 'Scheduled reminder notifications for tasks with due dates';
COMMENT ON COLUMN reminders.reminder_time IS 'When to send the reminder notification';
COMMENT ON COLUMN reminders.delivery_status IS 'Delivery status: pending, delivered, or failed';
COMMENT ON COLUMN reminders.retry_count IS 'Number of delivery retry attempts (max 3)';
