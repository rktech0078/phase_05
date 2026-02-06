/**
 * CloudEvents 1.0 specification types for event-driven communication
 */

export interface CloudEvent<T = any> {
  specversion: '1.0';
  type: string;
  source: string;
  id: string;
  time: string;
  datacontenttype: string;
  data: T;
}

// Task Event Types
export type TaskEventType =
  | 'com.todo.task.created'
  | 'com.todo.task.updated'
  | 'com.todo.task.completed'
  | 'com.todo.task.deleted';

// Reminder Event Types
export type ReminderEventType =
  | 'com.todo.reminder.scheduled'
  | 'com.todo.reminder.triggered'
  | 'com.todo.reminder.delivered'
  | 'com.todo.reminder.failed';

// Recurring Task Event Types
export type RecurringEventType = 'com.todo.recurring.generated';

// Task Event Data
export interface TaskCreatedEventData {
  taskId: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate?: string;
  recurrencePattern: 'none' | 'daily' | 'weekly' | 'monthly';
}

export interface TaskUpdatedEventData {
  taskId: string;
  userId: string;
  changes: Record<string, { old: any; new: any }>;
}

export interface TaskCompletedEventData {
  taskId: string;
  userId: string;
  isCompleted: boolean;
  recurrencePattern?: 'none' | 'daily' | 'weekly' | 'monthly';
  dueDate?: string;
}

export interface TaskDeletedEventData {
  taskId: string;
  userId: string;
}

// Reminder Event Data
export interface ReminderScheduledEventData {
  reminderId: string;
  taskId: string;
  userId: string;
  reminderTime: string;
}

export interface ReminderTriggeredEventData {
  reminderId: string;
  taskId: string;
  userId: string;
}

export interface ReminderDeliveredEventData {
  reminderId: string;
  taskId: string;
  userId: string;
  deliveredAt: string;
}

export interface ReminderFailedEventData {
  reminderId: string;
  taskId: string;
  userId: string;
  error: string;
  retryCount: number;
}

// Recurring Task Event Data
export interface RecurringTaskGeneratedEventData {
  originalTaskId: string;
  newTaskId: string;
  userId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate: string;
  recurrencePattern: 'daily' | 'weekly' | 'monthly';
}
