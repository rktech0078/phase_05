/**
 * Drizzle ORM schemas for PostgreSQL database
 */

import { pgTable, text, boolean, uuid, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

// User table (managed by Better Auth)
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

// Tasks table (extended with new fields)
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

// Reminders table
export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').notNull().references(() => tasks.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  reminderTime: timestamp('reminder_time', { withTimezone: true }).notNull(),
  deliveryStatus: text('delivery_status', { enum: ['pending', 'delivered', 'failed'] }).default('pending').notNull(),
  retryCount: integer('retry_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Audit logs table
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  action: text('action', { enum: ['created', 'updated', 'completed', 'deleted'] }).notNull(),
  changes: jsonb('changes'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  correlationId: text('correlation_id')
});

// Type exports for use in services
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
