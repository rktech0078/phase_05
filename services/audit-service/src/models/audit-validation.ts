/**
 * Audit log validation schemas using Zod
 */

import { z } from 'zod';

// Audit log entry validation schema
export const auditLogSchema = z.object({
  taskId: z.string().uuid().optional().nullable(),
  userId: z.string(),
  action: z.enum(['created', 'updated', 'completed', 'deleted']),
  changes: z.record(z.any()).optional(),
  timestamp: z.date(),
  correlationId: z.string().optional()
});

// Get audit logs query validation schema
export const getAuditLogsQuerySchema = z.object({
  taskId: z.string().uuid().optional(),
  userId: z.string().optional(),
  action: z.enum(['created', 'updated', 'completed', 'deleted']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).default('50'),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).default('0')
});

export type AuditLogInput = z.infer<typeof auditLogSchema>;
export type GetAuditLogsQuery = z.infer<typeof getAuditLogsQuerySchema>;
