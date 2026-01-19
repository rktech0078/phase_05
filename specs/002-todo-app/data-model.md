# Data Model: Todo Full-Stack Web Application

## Overview
This document outlines the data models for the Todo Full-Stack Web Application, including database schema, relationships, and validation rules.

## Entity Models

### User
**Description**: Represents an authenticated user of the system

**Fields**:
- `id` (string): Unique identifier for the user (UUID)
- `email` (string): User's email address (unique, validated)
- `created_at` (timestamp): When the user account was created
- `updated_at` (timestamp): When the user account was last updated

**Validation Rules**:
- Email must be a valid email format
- Email must be unique across all users
- Email cannot be empty

**Relationships**:
- One-to-many with Task (one user can have many tasks)

### Task
**Description**: Represents a todo item created by a user

**Fields**:
- `id` (string): Unique identifier for the task (UUID)
- `title` (string): Title of the task (required)
- `description` (string): Detailed description of the task (optional)
- `is_completed` (boolean): Whether the task is completed (default: false)
- `user_id` (string): Reference to the user who owns this task
- `created_at` (timestamp): When the task was created
- `updated_at` (timestamp): When the task was last updated

**Validation Rules**:
- Title cannot be empty
- Title must be less than 255 characters
- Description, if provided, must be less than 1000 characters
- User_id must reference an existing user
- is_completed must be a boolean value

**Relationships**:
- Many-to-one with User (many tasks belong to one user)

## Database Schema (Drizzle ORM)

```typescript
import { pgTable, serial, text, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks table
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  isCompleted: boolean('is_completed').default(false).notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

## State Transitions

### Task State Transitions
- **Created**: When a new task is added, `is_completed` is false by default
- **Completed**: When a user marks a task as complete, `is_completed` changes to true
- **Reopened**: When a user marks a completed task as incomplete, `is_completed` changes to false

## Indexes
- Index on `users.email` for fast email lookups during authentication
- Index on `tasks.user_id` for efficient retrieval of user-specific tasks
- Index on `tasks.is_completed` for filtering completed/incomplete tasks