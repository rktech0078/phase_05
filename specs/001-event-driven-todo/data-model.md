# Data Model

**Feature**: Event-Driven Todo Chatbot Platform
**Date**: 2026-01-19
**Status**: Complete

## Overview

This document defines the data model for the event-driven todo platform, including entity definitions, relationships, validation rules, and state transitions. The model extends the existing schema to support priorities, tags, due dates, recurring tasks, reminders, and audit trails.

---

## Entity Definitions

### 1. User

**Description**: Represents an authenticated user of the system. Managed by Better Auth.

**Table**: `user`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | text | PRIMARY KEY | Unique user identifier (Better Auth managed) |
| name | text | NOT NULL | User's display name |
| email | text | UNIQUE, NOT NULL | User's email address |
| emailVerified | boolean | NOT NULL, DEFAULT false | Email verification status |
| image | text | NULLABLE | User's profile image URL |
| createdAt | timestamp | NOT NULL, DEFAULT NOW() | Account creation timestamp |
| updatedAt | timestamp | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Relationships**:
- `hasMany` Tasks (one user has many tasks)
- `hasMany` Reminders (one user has many reminders)
- `hasMany` AuditLogEntries (one user has many audit log entries)

**Validation Rules**:
- Email must be valid email format
- Email must be unique across all users
- Name must be 1-100 characters

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`

**Notes**: This entity is managed by Better Auth and should not be modified directly by application code.

---

### 2. Task (Extended)

**Description**: Represents a todo item with support for priorities, tags, due dates, and recurrence patterns.

**Table**: `tasks`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique task identifier |
| title | text | NOT NULL | Task title (1-200 characters) |
| description | text | NULLABLE | Task description (0-2000 characters) |
| isCompleted | boolean | NOT NULL, DEFAULT false | Completion status |
| priority | text | NOT NULL, DEFAULT 'medium', CHECK IN ('low', 'medium', 'high') | Task priority level |
| tags | text[] | NOT NULL, DEFAULT '{}' | Array of tags (0-10 tags, each 1-50 characters) |
| dueDate | timestamp | NULLABLE | Due date and time (timezone-aware) |
| recurrencePattern | text | NOT NULL, DEFAULT 'none', CHECK IN ('none', 'daily', 'weekly', 'monthly') | Recurrence pattern |
| userId | text | NOT NULL, FOREIGN KEY → user.id ON DELETE CASCADE | Owner user ID |
| createdAt | timestamp | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updatedAt | timestamp | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Relationships**:
- `belongsTo` User (many tasks belong to one user)
- `hasMany` Reminders (one task has many reminders)
- `hasMany` AuditLogEntries (one task has many audit log entries)

**Validation Rules**:
- `title`: Required, 1-200 characters, non-empty after trim
- `description`: Optional, 0-2000 characters
- `priority`: Must be one of: 'low', 'medium', 'high'
- `tags`: Array of 0-10 strings, each 1-50 characters, lowercase, alphanumeric + hyphens
- `dueDate`: Must be valid timestamp, can be in past (for overdue detection)
- `recurrencePattern`: Must be one of: 'none', 'daily', 'weekly', 'monthly'
- `recurrencePattern`: Can only be set if `dueDate` is set (recurring tasks need due dates)

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `userId` (for user's task list queries)
- INDEX on `dueDate` WHERE `dueDate IS NOT NULL` (for reminder queries)
- INDEX on `priority` (for priority filtering)
- INDEX on `isCompleted` (for completion status filtering)
- COMPOSITE INDEX on `userId, isCompleted, dueDate` (for dashboard queries)

**State Transitions**:
```
incomplete (isCompleted=false) ←→ complete (isCompleted=true)
```

**Business Rules**:
1. When task is marked complete and has recurrence pattern ≠ 'none':
   - Emit `TaskCompleted` event with recurrence pattern
   - Recurring Service generates next instance
2. When task is created with `dueDate`:
   - Emit `TaskCreated` event
   - Notification Service schedules reminder
3. When task is deleted:
   - Cascade delete all reminders
   - Cascade delete all audit log entries (or set taskId to NULL)
4. When task `dueDate` is updated:
   - Cancel existing reminders
   - Schedule new reminders

**Drizzle ORM Schema**:
```typescript
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).default('medium').notNull(),
  tags: text('tags').array().default([]).notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }),
  recurrencePattern: text('recurrence_pattern', { enum: ['none', 'daily', 'weekly', 'monthly'] }).default('none').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});
```

---

### 3. Reminder (New)

**Description**: Represents a scheduled reminder notification for a task with a due date.

**Table**: `reminders`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique reminder identifier |
| taskId | uuid | NOT NULL, FOREIGN KEY → tasks.id ON DELETE CASCADE | Associated task ID |
| userId | text | NOT NULL, FOREIGN KEY → user.id ON DELETE CASCADE | Owner user ID |
| reminderTime | timestamp | NOT NULL | When to send the reminder (timezone-aware) |
| deliveryStatus | text | NOT NULL, DEFAULT 'pending', CHECK IN ('pending', 'delivered', 'failed') | Delivery status |
| retryCount | integer | NOT NULL, DEFAULT 0 | Number of delivery retry attempts |
| createdAt | timestamp | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Relationships**:
- `belongsTo` Task (many reminders belong to one task)
- `belongsTo` User (many reminders belong to one user)

**Validation Rules**:
- `reminderTime`: Must be valid timestamp, typically before task due date
- `deliveryStatus`: Must be one of: 'pending', 'delivered', 'failed'
- `retryCount`: Must be >= 0, max 3 retries

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `taskId` (for task's reminders queries)
- INDEX on `userId` (for user's reminders queries)
- COMPOSITE INDEX on `reminderTime, deliveryStatus` WHERE `deliveryStatus = 'pending'` (for cron job queries)

**State Transitions**:
```
pending → delivered (successful notification)
pending → failed (notification failed after 3 retries)
```

**Business Rules**:
1. Reminders are created when task with `dueDate` is created or updated
2. Default reminder time: 1 hour before `dueDate`
3. Notification Service checks for due reminders every 1 minute (Dapr cron binding)
4. On delivery failure: increment `retryCount`, retry up to 3 times
5. After 3 failed retries: set `deliveryStatus` to 'failed', emit `ReminderFailed` event
6. When task is completed before reminder time: delete reminder (no notification sent)
7. When task is deleted: cascade delete all reminders

**Drizzle ORM Schema**:
```typescript
export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  reminderTime: timestamp('reminder_time', { withTimezone: true }).notNull(),
  deliveryStatus: text('delivery_status', { enum: ['pending', 'delivered', 'failed'] }).default('pending').notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
```

---

### 4. AuditLogEntry (New)

**Description**: Represents a recorded action on a task for audit trail and compliance.

**Table**: `audit_logs`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique audit log entry identifier |
| taskId | uuid | NULLABLE, FOREIGN KEY → tasks.id ON DELETE SET NULL | Associated task ID (nullable for deleted tasks) |
| userId | text | NOT NULL, FOREIGN KEY → user.id ON DELETE CASCADE | User who performed the action |
| action | text | NOT NULL, CHECK IN ('created', 'updated', 'completed', 'deleted') | Action type |
| changes | jsonb | NULLABLE | JSON object with change details (old → new values) |
| timestamp | timestamp | NOT NULL, DEFAULT NOW() | When the action occurred |
| correlationId | text | NULLABLE | Correlation ID for distributed tracing |

**Relationships**:
- `belongsTo` Task (many audit log entries belong to one task, nullable)
- `belongsTo` User (many audit log entries belong to one user)

**Validation Rules**:
- `action`: Must be one of: 'created', 'updated', 'completed', 'deleted'
- `changes`: Must be valid JSON object (for 'updated' action)
- `correlationId`: Optional, UUID format

**Indexes**:
- PRIMARY KEY on `id`
- INDEX on `taskId` (for task's audit log queries)
- INDEX on `userId, timestamp DESC` (for user's activity history)
- INDEX on `timestamp DESC` (for recent activity queries)
- INDEX on `correlationId` (for distributed tracing)

**Changes JSON Structure**:

**For 'created' action**:
```json
{
  "title": "Buy groceries",
  "priority": "medium",
  "tags": ["shopping"],
  "dueDate": "2026-01-20T14:00:00Z"
}
```

**For 'updated' action**:
```json
{
  "title": { "old": "Buy groceries", "new": "Buy groceries and cook dinner" },
  "priority": { "old": "medium", "new": "high" },
  "tags": { "old": ["shopping"], "new": ["shopping", "urgent"] }
}
```

**For 'completed' action**:
```json
{
  "isCompleted": { "old": false, "new": true }
}
```

**For 'deleted' action**:
```json
{
  "title": "Buy groceries",
  "isCompleted": false
}
```

**Business Rules**:
1. Audit log entries are created automatically by Audit Service (subscribes to `task-events` topic)
2. Entries are immutable (no updates or deletes)
3. When task is deleted: `taskId` is set to NULL (preserve audit trail)
4. Retention: 90 days minimum (configurable)
5. Correlation ID links audit entries to distributed traces

**Drizzle ORM Schema**:
```typescript
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  action: text('action', { enum: ['created', 'updated', 'completed', 'deleted'] }).notNull(),
  changes: jsonb('changes'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  correlationId: text('correlation_id')
});
```

---

## Entity Relationship Diagram

```
┌─────────────────┐
│      User       │
│─────────────────│
│ id (PK)         │
│ name            │
│ email (UNIQUE)  │
│ emailVerified   │
│ image           │
│ createdAt       │
│ updatedAt       │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴────────────────────────────────┐
    │                                     │
    │                                     │
┌───▼──────────────┐              ┌──────▼──────────┐
│      Task        │              │    Reminder     │
│──────────────────│              │─────────────────│
│ id (PK)          │ 1:N          │ id (PK)         │
│ title            │◄─────────────┤ taskId (FK)     │
│ description      │              │ userId (FK)     │
│ isCompleted      │              │ reminderTime    │
│ priority         │              │ deliveryStatus  │
│ tags[]           │              │ retryCount      │
│ dueDate          │              │ createdAt       │
│ recurrencePattern│              └─────────────────┘
│ userId (FK)      │
│ createdAt        │
│ updatedAt        │
└───┬──────────────┘
    │
    │ 1:N
    │
┌───▼──────────────┐
│  AuditLogEntry   │
│──────────────────│
│ id (PK)          │
│ taskId (FK)      │
│ userId (FK)      │
│ action           │
│ changes (JSONB)  │
│ timestamp        │
│ correlationId    │
└──────────────────┘
```

---

## State Transition Diagrams

### Task Lifecycle

```
┌─────────────┐
│   Created   │
│ (incomplete)│
└──────┬──────┘
       │
       │ mark complete
       ▼
┌─────────────┐
│  Completed  │
│ (complete)  │
└──────┬──────┘
       │
       │ mark incomplete
       ▼
┌─────────────┐
│   Active    │
│ (incomplete)│
└──────┬──────┘
       │
       │ delete
       ▼
┌─────────────┐
│   Deleted   │
│  (removed)  │
└─────────────┘
```

### Reminder Lifecycle

```
┌─────────────┐
│   Created   │
│  (pending)  │
└──────┬──────┘
       │
       │ reminder time arrives
       ▼
┌─────────────┐
│  Triggered  │
│  (pending)  │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       │ success     │ failure (retry < 3)
       ▼             ▼
┌─────────────┐  ┌─────────────┐
│  Delivered  │  │   Retry     │
│ (delivered) │  │  (pending)  │
└─────────────┘  └──────┬──────┘
                        │
                        │ failure (retry = 3)
                        ▼
                 ┌─────────────┐
                 │   Failed    │
                 │  (failed)   │
                 └─────────────┘
```

### Recurring Task Flow

```
┌─────────────────┐
│  Recurring Task │
│   (incomplete)  │
└────────┬────────┘
         │
         │ mark complete
         ▼
┌─────────────────┐
│    Completed    │
│   (complete)    │
└────────┬────────┘
         │
         │ emit TaskCompleted event
         ▼
┌─────────────────┐
│ Recurring Svc   │
│ generates next  │
└────────┬────────┘
         │
         │ emit RecurringTaskGenerated event
         ▼
┌─────────────────┐
│  New Instance   │
│   (incomplete)  │
│ (next due date) │
└─────────────────┘
```

---

## Data Integrity Rules

### Referential Integrity

1. **User Deletion**:
   - CASCADE delete all tasks
   - CASCADE delete all reminders
   - CASCADE delete all audit log entries

2. **Task Deletion**:
   - CASCADE delete all reminders
   - SET NULL on audit log entries (preserve audit trail)

3. **Orphaned Records**:
   - No orphaned tasks (userId always references valid user)
   - No orphaned reminders (taskId and userId always reference valid records)
   - Audit logs can have NULL taskId (for deleted tasks)

### Consistency Rules

1. **Recurring Tasks**:
   - If `recurrencePattern` ≠ 'none', then `dueDate` MUST be set
   - Enforced at application level (not database constraint)

2. **Reminders**:
   - Reminders can only exist for tasks with `dueDate` set
   - Enforced at application level

3. **Audit Logs**:
   - Every task operation MUST generate an audit log entry
   - Enforced by Audit Service (subscribes to all task events)

4. **Timestamps**:
   - `createdAt` is immutable (set once on creation)
   - `updatedAt` is updated on every modification
   - Enforced by database triggers or ORM hooks

---

## Performance Considerations

### Query Optimization

**Common Queries**:

1. **User's task list** (most frequent):
   ```sql
   SELECT * FROM tasks
   WHERE userId = ? AND isCompleted = false
   ORDER BY dueDate ASC NULLS LAST, priority DESC
   ```
   - Uses composite index: `(userId, isCompleted, dueDate)`

2. **Due reminders** (cron job every 1 minute):
   ```sql
   SELECT * FROM reminders
   WHERE reminderTime <= NOW() AND deliveryStatus = 'pending'
   LIMIT 100
   ```
   - Uses composite index: `(reminderTime, deliveryStatus) WHERE deliveryStatus = 'pending'`

3. **Task audit history**:
   ```sql
   SELECT * FROM audit_logs
   WHERE taskId = ?
   ORDER BY timestamp DESC
   ```
   - Uses index: `(taskId)`

4. **User activity history**:
   ```sql
   SELECT * FROM audit_logs
   WHERE userId = ?
   ORDER BY timestamp DESC
   LIMIT 50
   ```
   - Uses composite index: `(userId, timestamp DESC)`

### Caching Strategy

**Dapr State Store (Redis)**:
- Cache frequently accessed tasks (hot data)
- Cache user's active task list (TTL: 5 minutes)
- Cache user session data
- Invalidate on task updates (event-driven)

**Cache Keys**:
- `task:{taskId}` - Individual task
- `user:{userId}:tasks:active` - User's active tasks
- `user:{userId}:tasks:completed` - User's completed tasks

---

## Data Migration Plan

### Phase 1: Add New Columns to Tasks Table
```sql
ALTER TABLE tasks
  ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  ADD COLUMN tags TEXT[] DEFAULT '{}',
  ADD COLUMN due_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN recurrence_pattern TEXT DEFAULT 'none' CHECK (recurrence_pattern IN ('none', 'daily', 'weekly', 'monthly'));

CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_user_completed_due ON tasks(user_id, is_completed, due_date);
```

### Phase 2: Create Reminders Table
```sql
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  reminder_time TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reminders_due ON reminders(reminder_time, delivery_status) WHERE delivery_status = 'pending';
CREATE INDEX idx_reminders_task ON reminders(task_id);
CREATE INDEX idx_reminders_user ON reminders(user_id);
```

### Phase 3: Create Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'completed', 'deleted')),
  changes JSONB,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  correlation_id TEXT
);

CREATE INDEX idx_audit_logs_task ON audit_logs(task_id);
CREATE INDEX idx_audit_logs_user_time ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_correlation ON audit_logs(correlation_id);
```

---

## Summary

This data model extends the existing schema to support:
- ✅ Task priorities (low, medium, high)
- ✅ Task tags (array of strings)
- ✅ Due dates with timezone support
- ✅ Recurrence patterns (daily, weekly, monthly)
- ✅ Reminder notifications with retry logic
- ✅ Comprehensive audit trail with change tracking
- ✅ Distributed tracing via correlation IDs
- ✅ Performance optimization via strategic indexes
- ✅ Data integrity via foreign keys and cascades
- ✅ Zero-downtime migrations via additive-only changes

All entities are designed for event-driven architecture with clear state transitions and business rules that align with the microservices decomposition strategy.
