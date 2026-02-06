-- Migration 001: Add new fields to tasks table
-- Description: Add priority, tags, dueDate, and recurrencePattern columns to support advanced task management

-- Add new columns with defaults for backward compatibility
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT DEFAULT 'none' CHECK (recurrence_pattern IN ('none', 'daily', 'weekly', 'monthly'));

-- Create indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed_due ON tasks(user_id, is_completed, due_date);

-- Add comment for documentation
COMMENT ON COLUMN tasks.priority IS 'Task priority level: low, medium, or high';
COMMENT ON COLUMN tasks.tags IS 'Array of tags for task categorization';
COMMENT ON COLUMN tasks.due_date IS 'Due date and time for the task (timezone-aware)';
COMMENT ON COLUMN tasks.recurrence_pattern IS 'Recurrence pattern: none, daily, weekly, or monthly';
