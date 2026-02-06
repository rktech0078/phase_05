/**
 * Publish ReminderFailed event
 */

import { v4 as uuidv4 } from 'uuid';
import { daprClient, PUBSUB_NAME, TOPICS } from '../dapr/client';
import { CloudEvent, ReminderFailedEventData } from '../../../shared/types/events';
import { logger, createLogger } from '../../../shared/utils/logger';

export async function publishReminderFailedEvent(
  reminderData: ReminderFailedEventData,
  correlationId?: string
): Promise<void> {
  const log = createLogger(correlationId);

  try {
    const event: CloudEvent<ReminderFailedEventData> = {
      specversion: '1.0',
      type: 'com.todo.reminder.failed',
      source: 'notification-service',
      id: uuidv4(),
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: reminderData
    };

    await daprClient.pubsub.publish(PUBSUB_NAME, TOPICS.REMINDERS, event);

    log.error('ReminderFailed event published', {
      eventId: event.id,
      reminderId: reminderData.reminderId,
      taskId: reminderData.taskId,
      error: reminderData.error,
      retryCount: reminderData.retryCount
    });
  } catch (error) {
    log.error('Failed to publish ReminderFailed event', { error, reminderData });
    throw error;
  }
}
