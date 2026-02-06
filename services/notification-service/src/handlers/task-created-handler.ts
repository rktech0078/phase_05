/**
 * TaskCreated event handler for notification-service
 * Schedules reminders when tasks with due dates are created
 */

import { CloudEvent, TaskCreatedEventData } from '../../../shared/types/events';
import { scheduleReminder } from '../scheduler/schedule-reminder';
import { logger, createLogger } from '../../../shared/utils/logger';

export async function handleTaskCreated(event: CloudEvent<TaskCreatedEventData>): Promise<void> {
  const log = createLogger(event.id);

  try {
    const { taskId, userId, dueDate } = event.data;

    // Only schedule reminder if task has a due date
    if (!dueDate) {
      log.info('Task created without due date, skipping reminder', { taskId });
      return;
    }

    // Schedule reminder (default: 1 hour before due date)
    await scheduleReminder(taskId, userId, new Date(dueDate), event.id);

    log.info('Reminder scheduled for task', {
      taskId,
      userId,
      dueDate
    });
  } catch (error) {
    log.error('Error handling TaskCreated event', { error, event });
    throw error;
  }
}
