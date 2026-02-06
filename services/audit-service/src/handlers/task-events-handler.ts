/**
 * Task events handler for audit-service
 * Subscribes to all task events and creates audit log entries
 */

import { CloudEvent } from '../../../shared/types/events';
import { createAuditLog } from './create-audit-log';
import { logger, createLogger } from '../../../shared/utils/logger';

export async function handleTaskEvents(event: CloudEvent): Promise<void> {
  const log = createLogger(event.id);

  try {
    const { type, data, id: correlationId } = event;

    // Determine action from event type
    let action: 'created' | 'updated' | 'completed' | 'deleted';
    let changes: Record<string, any> | undefined;

    switch (type) {
      case 'com.todo.task.created':
        action = 'created';
        changes = {
          title: data.title,
          priority: data.priority,
          tags: data.tags,
          dueDate: data.dueDate,
          recurrencePattern: data.recurrencePattern
        };
        break;

      case 'com.todo.task.updated':
        action = 'updated';
        changes = data.changes;
        break;

      case 'com.todo.task.completed':
        action = 'completed';
        changes = {
          isCompleted: { old: !data.isCompleted, new: data.isCompleted }
        };
        break;

      case 'com.todo.task.deleted':
        action = 'deleted';
        changes = undefined;
        break;

      default:
        log.warn('Unknown event type', { type });
        return;
    }

    // Create audit log entry
    await createAuditLog({
      taskId: data.taskId,
      userId: data.userId,
      action,
      changes,
      correlationId
    });

    log.info('Audit log created', {
      taskId: data.taskId,
      userId: data.userId,
      action
    });
  } catch (error) {
    log.error('Error handling task event', { error, event });
    throw error;
  }
}
