/**
 * TaskCompleted event handler for recurring-service
 * Generates next task instance when a recurring task is completed
 */

import { CloudEvent, TaskCompletedEventData } from '../../../shared/types/events';
import { generateNextInstance } from '../generators/generate-next-instance';
import { logger, createLogger } from '../../../shared/utils/logger';

export async function handleTaskCompleted(event: CloudEvent<TaskCompletedEventData>): Promise<void> {
  const log = createLogger(event.id);

  try {
    const { taskId, userId, isCompleted, recurrencePattern, dueDate } = event.data;

    // Only generate next instance if task is completed and has recurrence pattern
    if (!isCompleted) {
      log.info('Task not completed, skipping recurring task generation', { taskId });
      return;
    }

    if (!recurrencePattern || recurrencePattern === 'none') {
      log.info('Task has no recurrence pattern, skipping', { taskId });
      return;
    }

    if (!dueDate) {
      log.error('Recurring task has no due date, cannot generate next instance', { taskId });
      return;
    }

    // Generate next task instance
    await generateNextInstance(taskId, userId, new Date(dueDate), recurrencePattern, event.id);

    log.info('Next recurring task instance generated', {
      originalTaskId: taskId,
      userId,
      recurrencePattern
    });
  } catch (error) {
    log.error('Error handling TaskCompleted event', { error, event });
    throw error;
  }
}
