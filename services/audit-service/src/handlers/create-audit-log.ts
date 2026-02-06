/**
 * Create audit log entry
 */

import { v4 as uuidv4 } from 'uuid';
import { db, auditLogs } from '../db/connection';
import { logger, createLogger } from '../../../shared/utils/logger';

interface CreateAuditLogInput {
  taskId?: string;
  userId: string;
  action: 'created' | 'updated' | 'completed' | 'deleted';
  changes?: Record<string, any>;
  correlationId?: string;
}

/**
 * Create an audit log entry in the database
 */
export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  const log = createLogger(input.correlationId);

  try {
    const [auditLog] = await db.insert(auditLogs).values({
      id: uuidv4(),
      taskId: input.taskId,
      userId: input.userId,
      action: input.action,
      changes: input.changes,
      timestamp: new Date(),
      correlationId: input.correlationId
    }).returning();

    log.info('Audit log entry created', {
      auditLogId: auditLog.id,
      taskId: input.taskId,
      userId: input.userId,
      action: input.action
    });
  } catch (error) {
    log.error('Error creating audit log entry', { error, input });
    throw error;
  }
}
