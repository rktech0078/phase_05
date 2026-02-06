/**
 * Publish RecurringTaskGenerated event
 */

import { v4 as uuidv4 } from 'uuid';
import { daprClient, PUBSUB_NAME, TOPICS } from '../dapr/client';
import { CloudEvent, RecurringTaskGeneratedEventData } from '../../../shared/types/events';
import { logger, createLogger } from '../../../shared/utils/logger';

export async function publishRecurringTaskGeneratedEvent(
  taskData: RecurringTaskGeneratedEventData,
  correlationId?: string
): Promise<void> {
  const log = createLogger(correlationId);

  try {
    const event: CloudEvent<RecurringTaskGeneratedEventData> = {
      specversion: '1.0',
      type: 'com.todo.recurring.generated',
      source: 'recurring-service',
      id: uuidv4(),
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: taskData
    };

    await daprClient.pubsub.publish(PUBSUB_NAME, TOPICS.TASK_EVENTS, event);

    log.info('RecurringTaskGenerated event published', {
      eventId: event.id,
      originalTaskId: taskData.originalTaskId,
      newTaskId: taskData.newTaskId,
      userId: taskData.userId
    });
  } catch (error) {
    log.error('Failed to publish RecurringTaskGenerated event', { error, taskData });
    throw error;
  }
}
