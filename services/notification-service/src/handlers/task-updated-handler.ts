/**
 * TaskUpdated event handler for notification-service
 * Reschedules reminders when task due date is updated
 */

import { eq, and } from 'drizzle-orm';
import { CloudEvent, TaskUpdatedEventData } from '../../../shared/types/events';
import { db, reminders, tasks } from '../db/connection';
import { scheduleReminder } from '../scheduler/schedule-reminder';
import { logger, createLogger } from '../../../shared/utils/logger';

export async function handleTaskUpdated(event: CloudEvent<TaskUpdatedEventData>): Promise<void> {
  const log = createLogger(event.id);

  try {
    const { taskId, userId, changes } = event.data;

    // Check if due date was changed
    if (!changes.dueDate) {
      log.info('Task updated without due date change, no action needed', { taskId });
      return;
    }

    // Delete existing pending reminders
    await db
      .delete(reminders)
      .where(
        and(
          eq(reminders.taskId, taskId),
          eq(reminders.deliveryStatus, 'pending')
        )
      );

    log.info('Existing reminders deleted for task', { taskId });

    // If new due date is set, schedule new reminder
    if (changes.dueDate.new) {
      await scheduleReminder(taskId, userId, new Date(changes.dueDate.new), event.id);
      log.info('New reminder scheduled for updated task', {
        taskId,
        newDueDate: changes.dueDate.new
      });
    } else {
      log.info('Due date removed, no new reminder scheduled', { taskId });
    }
  } catch (error) {
    log.error('Error handling TaskUpdated event', { error, event });
    throw error;
  }
}
