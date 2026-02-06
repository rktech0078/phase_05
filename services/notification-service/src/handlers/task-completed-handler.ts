/**
 * TaskCompleted event handler for notification-service
 * Cancels reminders when tasks are completed
 */

import { eq, and } from 'drizzle-orm';
import { CloudEvent, TaskCompletedEventData } from '../../../shared/types/events';
import { db, reminders } from '../db/connection';
import { logger, createLogger } from '../../../shared/utils/logger';

export async function handleTaskCompleted(event: CloudEvent<TaskCompletedEventData>): Promise<void> {
  const log = createLogger(event.id);

  try {
    const { taskId, userId, isCompleted } = event.data;

    // Only cancel reminders if task is marked as completed
    if (!isCompleted) {
      log.info('Task marked as incomplete, keeping reminders', { taskId });
      return;
    }

    // Delete pending reminders for the completed task
    const deletedReminders = await db
      .delete(reminders)
      .where(
        and(
          eq(reminders.taskId, taskId),
          eq(reminders.deliveryStatus, 'pending')
        )
      )
      .returning();

    if (deletedReminders.length > 0) {
      log.info('Reminders cancelled for completed task', {
        taskId,
        userId,
        count: deletedReminders.length
      });
    } else {
      log.info('No pending reminders to cancel', { taskId });
    }
  } catch (error) {
    log.error('Error handling TaskCompleted event', { error, event });
    throw error;
  }
}
