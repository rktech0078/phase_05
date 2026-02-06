/**
 * Entity interfaces for the todo platform
 */

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  dueDate?: Date;
  recurrencePattern: 'none' | 'daily' | 'weekly' | 'monthly';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  taskId: string;
  userId: string;
  reminderTime: Date;
  deliveryStatus: 'pending' | 'delivered' | 'failed';
  retryCount: number;
  createdAt: Date;
}

export interface AuditLogEntry {
  id: string;
  taskId?: string;
  userId: string;
  action: 'created' | 'updated' | 'completed' | 'deleted';
  changes?: Record<string, any>;
  timestamp: Date;
  correlationId?: string;
}
