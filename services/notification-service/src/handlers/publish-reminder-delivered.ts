/**
 * Publish ReminderDelivered event
 */

import { v4 as uuidv4 } from 'uuid';
import { daprClient, PUBSUB_NAME, TOPICS } from '../dapr/client';
import { CloudEvent, ReminderDeliveredEventData } from '../../../shared/types/events';
import { logger, createLogger } from '../../../shared/utils/logger';

export async function publishReminderDeliveredEvent(
  reminderData: ReminderDeliveredEventData,
  correlationId?: string
): Promise<void> {
  const log = createLogger(correlationId);

  try {
    const event: CloudEvent<ReminderDeliveredEventData> = {
      specversion: '1.0',
      type: 'com.todo.reminder.delivered',
      source: 'notification-service',
      id: uuidv4(),
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: reminderData
    };

    await daprClient.pubsub.publish(PUBSUB_NAME, TOPICS.REMINDERS, event);

    log.info('ReminderDelivered event published', {
      eventId: event.id,
      reminderId: reminderData.reminderId,
      taskId: reminderData.taskId
    });
  } catch (error) {
    log.error('Failed to publish ReminderDelivered event', { error, reminderData });
    throw error;
  }
}
