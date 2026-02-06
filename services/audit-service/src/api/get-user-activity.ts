/**
 * Get user activity history API endpoint
 */

import { Request, Response } from 'express';
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm';
import { db, auditLogs } from '../db/connection';
import { getAuditLogsQuerySchema } from '../models/audit-validation';
import { logger, createLogger } from '../../../shared/utils/logger';
import { extractCorrelationId } from '../../../shared/utils/correlation';

export async function getUserActivityHistory(req: Request, res: Response): Promise<void> {
  const correlationId = extractCorrelationId(req.headers as Record<string, string>);
  const log = createLogger(correlationId);

  try {
    // Get user ID from auth context
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      return;
    }

    // Validate query parameters
    const validationResult = getAuditLogsQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: validationResult.error.errors
      });
      return;
    }

    const query = validationResult.data;

    // Build where conditions
    const conditions = [eq(auditLogs.userId, userId)];

    if (query.taskId) {
      conditions.push(eq(auditLogs.taskId, query.taskId));
    }

    if (query.action) {
      conditions.push(eq(auditLogs.action, query.action));
    }

    if (query.startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(query.startDate)));
    }

    if (query.endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(query.endDate)));
    }

    // Execute query
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(...conditions))
      .orderBy(desc(auditLogs.timestamp))
      .limit(query.limit)
      .offset(query.offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(and(...conditions));

    log.info('User activity history retrieved', {
      userId,
      count: logs.length,
      total: count
    });

    // Return audit logs with pagination info
    res.status(200).json({
      data: logs.map(log => ({
        id: log.id,
        taskId: log.taskId,
        userId: log.userId,
        action: log.action,
        changes: log.changes,
        timestamp: log.timestamp.toISOString(),
        correlationId: log.correlationId
      })),
      total: Number(count),
      limit: query.limit,
      offset: query.offset
    });
  } catch (error) {
    log.error('Error retrieving user activity history', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve activity history'
    });
  }
}
