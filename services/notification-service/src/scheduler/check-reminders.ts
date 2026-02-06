/**
 * Check for due reminders and send notifications
 * Called by Dapr cron binding every 1 minute
 */

import { lte, eq, and } from 'drizzle-orm';
import { db, reminders } from '../db/connection';
import { sendNotification } from '../notifiers/push-notifier';
import { publishReminderTriggeredEvent } from '../handlers/publish-reminder-triggered';
import { publishReminderDeliveredEvent } from '../handlers/publish-reminder-delivered';
import { publishReminderFailedEvent } from '../handlers/publish-reminder-failed';
import { logger } from '../../../shared/utils/logger';

/**
 * Check for due reminders and process them
 */
export async function checkReminders(): Promise<void> {
  try {
    const now = new Date();

    // Fetch due reminders (pending status, reminder time <= now)
    const dueReminders = await db
      .select()
      .from(reminders)
      .where(
        and(
          lte(reminders.reminderTime, now),
          eq(reminders.deliveryStatus, 'pending')
        )
      )
      .limit(100); // Process in batches

    if (dueReminders.length === 0) {
      logger.debug('No due reminders found');
      return;
    }

    logger.info(`Processing ${dueReminders.length} due reminders`);

    // Process each reminder
    for (const reminder of dueReminders) {
      try {
        // Publish ReminderTriggered event
        await publishReminderTriggeredEvent({
          reminderId: reminder.id,
          taskId: reminder.taskId,
          userId: reminder.userId
        });

        // Send notification
        const success = await sendNotification(reminder);

        if (success) {
          // Update reminder status to delivered
          await db
            .update(reminders)
            .set({
              deliveryStatus: 'delivered'
            })
            .where(eq(reminders.id, reminder.id));

          // Publish ReminderDelivered event
          await publishReminderDeliveredEvent({
            reminderId: reminder.id,
            taskId: reminder.taskId,
            userId: reminder.userId,
            deliveredAt: new Date().toISOString()
          });

          logger.info('Reminder delivered successfully', {
            reminderId: reminder.id,
            taskId: reminder.taskId
          });
        } else {
          // Increment retry count
          const newRetryCount = reminder.retryCount + 1;

          if (newRetryCount >= 3) {
            // Max retries reached, mark as failed
            await db
              .update(reminders)
              .set({
                deliveryStatus: 'failed',
                retryCount: newRetryCount
              })
              .where(eq(reminders.id, reminder.id));

            // Publish ReminderFailed event
            await publishReminderFailedEvent({
              reminderId: reminder.id,
              taskId: reminder.taskId,
              userId: reminder.userId,
              error: 'Max retries reached',
              retryCount: newRetryCount
            });

            logger.error('Reminder failed after max retries', {
              reminderId: reminder.id,
              taskId: reminder.taskId,
              retryCount: newRetryCount
            });
          } else {
            // Update retry count, keep as pending
            await db
              .update(reminders)
              .set({
                retryCount: newRetryCount
              })
              .where(eq(reminders.id, reminder.id));

            logger.warn('Reminder delivery failed, will retry', {
              reminderId: reminder.id,
              taskId: reminder.taskId,
              retryCount: newRetryCount
            });
          }
        }
      } catch (error) {
        logger.error('Error processing reminder', {
          error,
          reminderId: reminder.id,
          taskId: reminder.taskId
        });
      }
    }
  } catch (error) {
    logger.error('Error checking reminders', { error });
  }
}
