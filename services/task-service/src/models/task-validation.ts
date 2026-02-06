/**
 * Task validation schemas using Zod
 */

import { z } from 'zod';

// Create task validation schema
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').trim(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string().min(1).max(50).toLowerCase()).max(10, 'Maximum 10 tags allowed').default([]),
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

// Update task validation schema
export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').trim().optional(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.array(z.string().min(1).max(50).toLowerCase()).max(10, 'Maximum 10 tags allowed').optional(),
  dueDate: z.string().datetime().optional().nullable(),
  recurrencePattern: z.enum(['none', 'daily', 'weekly', 'monthly']).optional()
});

// Toggle completion validation schema
export const toggleCompletionSchema = z.object({
  isCompleted: z.boolean()
});

// Get tasks query validation schema
export const getTasksQuerySchema = z.object({
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tags: z.string().transform(val => val.split(',').filter(Boolean)).optional(),
  isCompleted: z.string().transform(val => val === 'true').optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  overdue: z.string().transform(val => val === 'true').optional(),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

// Search tasks query validation schema
export const searchTasksQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').trim(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ToggleCompletionInput = z.infer<typeof toggleCompletionSchema>;
export type GetTasksQuery = z.infer<typeof getTasksQuerySchema>;
