/**
 * Get task audit history API endpoint
 */

import { Request, Response } from 'express';
import { eq, desc } from 'drizzle-orm';
import { db, auditLogs } from '../db/connection';
import { logger, createLogger } from '../../../shared/utils/logger';
import { extractCorrelationId } from '../../../shared/utils/correlation';

export async function getTaskAuditHistory(req: Request, res: Response): Promise<void> {
  const correlationId = extractCorrelationId(req.headers as Record<string, string>);
  const log = createLogger(correlationId);

  try {
    const { taskId } = req.params;

    if (!taskId) {
      res.status(400).json({ error: 'Bad Request', message: 'Task ID is required' });
      return;
    }

    // Fetch audit logs for the task
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.taskId, taskId))
      .orderBy(desc(auditLogs.timestamp));

    log.info('Task audit history retrieved', {
      taskId,
      count: logs.length
    });

    // Return audit logs
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
      total: logs.length
    });
  } catch (error) {
    log.error('Error retrieving task audit history', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve audit history'
    });
  }
}
