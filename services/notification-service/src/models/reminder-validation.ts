/**
 * Reminder validation schemas using Zod
 */

import { z } from 'zod';

// Reminder validation schema
export const reminderSchema = z.object({
  taskId: z.string().uuid(),
  userId: z.string(),
  reminderTime: z.date(),
  deliveryStatus: z.enum(['pending', 'delivered', 'failed']).default('pending'),
  retryCount: z.number().int().min(0).max(3).default(0)
});

// Create reminder input schema
export const createReminderSchema = z.object({
  taskId: z.string().uuid(),
  userId: z.string(),
  reminderTime: z.string().datetime()
});

export type ReminderInput = z.infer<typeof reminderSchema>;
export type CreateReminderInput = z.infer<typeof createReminderSchema>;
