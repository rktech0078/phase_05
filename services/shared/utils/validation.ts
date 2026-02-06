/**
 * Zod validation schemas for API requests and events
 */

import { z } from 'zod';

// Task validation schemas
export const createTaskSchema = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string().min(1).max(50).toLowerCase()).max(10).default([]),
  dueDate: z.string().datetime().optional(),
  recurrencePattern: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none')
}).refine(
  (data) => {
    // If recurrence pattern is set, dueDate must be provided
    if (data.recurrencePattern !== 'none' && !data.dueDate) {
      return false;
    }
    return true;
  },
  {
    message: 'Due date is required when recurrence pattern is set',
    path: ['dueDate']
  }
);

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string().min(1).max(50).toLowerCase()).max(10).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  recurrencePattern: z.enum(['none', 'daily', 'weekly', 'monthly']).optional()
});

export const getTasksQuerySchema = z.object({
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string()).optional(),
  isCompleted: z.boolean().optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  overdue: z.boolean().optional(),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
});

export const searchTasksQuerySchema = z.object({
  query: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
});

// Audit log validation schemas
export const getAuditLogsQuerySchema = z.object({
  taskId: z.string().uuid().optional(),
  userId: z.string().optional(),
  action: z.enum(['created', 'updated', 'completed', 'deleted']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0)
});

// CloudEvent validation schema
export const cloudEventSchema = z.object({
  specversion: z.literal('1.0'),
  type: z.string(),
  source: z.string(),
  id: z.string().uuid(),
  time: z.string().datetime(),
  datacontenttype: z.string(),
  data: z.any()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type GetTasksQuery = z.infer<typeof getTasksQuerySchema>;
export type SearchTasksQuery = z.infer<typeof searchTasksQuerySchema>;
export type GetAuditLogsQuery = z.infer<typeof getAuditLogsQuerySchema>;
