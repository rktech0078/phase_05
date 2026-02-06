/**
 * Publish TaskDeleted event
 */

import { v4 as uuidv4 } from 'uuid';
import { daprClient, PUBSUB_NAME, TOPICS } from '../dapr/client';
import { CloudEvent, TaskDeletedEventData } from '../../../shared/types/events';
import { logger, createLogger } from '../../../shared/utils/logger';

export async function publishTaskDeletedEvent(
  taskData: TaskDeletedEventData,
  correlationId?: string
): Promise<void> {
  const log = createLogger(correlationId);

  try {
    const event: CloudEvent<TaskDeletedEventData> = {
      specversion: '1.0',
      type: 'com.todo.task.deleted',
      source: 'task-service',
      id: uuidv4(),
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: taskData
    };

    await daprClient.pubsub.publish(PUBSUB_NAME, TOPICS.TASK_EVENTS, event);

    log.info('TaskDeleted event published', {
      eventId: event.id,
      taskId: taskData.taskId,
      userId: taskData.userId
    });

    // Also publish to task-updates topic for real-time sync
    await daprClient.pubsub.publish(PUBSUB_NAME, TOPICS.TASK_UPDATES, event);
  } catch (error) {
    log.error('Failed to publish TaskDeleted event', { error, taskData });
    throw error;
  }
}
