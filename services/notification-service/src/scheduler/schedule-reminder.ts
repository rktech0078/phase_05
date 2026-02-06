/**
 * Schedule reminder for a task
 */

import { v4 as uuidv4 } from 'uuid';
import { db, reminders } from '../db/connection';
import { publishReminderScheduledEvent } from '../handlers/publish-reminder-scheduled';
import { logger, createLogger } from '../../../shared/utils/logger';

/**
 * Schedule a reminder for a task
 * Default: 1 hour before due date
 */
export async function scheduleReminder(
  taskId: string,
  userId: string,
  dueDate: Date,
  correlationId?: string
): Promise<void> {
  const log = createLogger(correlationId);

  try {
    // Calculate reminder time (1 hour before due date)
    const reminderTime = new Date(dueDate.getTime() - 60 * 60 * 1000);

    // Don't schedule if reminder time is in the past
    if (reminderTime < new Date()) {
      log.info('Reminder time is in the past, skipping', {
        taskId,
        reminderTime: reminderTime.toISOString()
      });
      return;
    }

    // Create reminder in database
    const [reminder] = await db.insert(reminders).values({
      id: uuidv4(),
      taskId,
      userId,
      reminderTime,
      deliveryStatus: 'pending',
      retryCount: 0,
      createdAt: new Date()
    }).returning();

    log.info('Reminder scheduled', {
      reminderId: reminder.id,
      taskId,
      userId,
      reminderTime: reminder.reminderTime.toISOString()
    });

    // Publish ReminderScheduled event
    await publishReminderScheduledEvent({
      reminderId: reminder.id,
      taskId,
      userId,
      reminderTime: reminder.reminderTime.toISOString()
    }, correlationId);
  } catch (error) {
    log.error('Error scheduling reminder', { error, taskId, userId });
    throw error;
  }
}
