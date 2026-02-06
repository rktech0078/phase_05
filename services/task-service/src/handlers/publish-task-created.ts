/**
 * Publish TaskCreated event
 */

import { v4 as uuidv4 } from 'uuid';
import { daprClient, PUBSUB_NAME, TOPICS } from '../dapr/client';
import { CloudEvent, TaskCreatedEventData } from '../../../shared/types/events';
import { logger, createLogger } from '../../../shared/utils/logger';

export async function publishTaskCreatedEvent(
  taskData: TaskCreatedEventData,
  correlationId?: string
): Promise<void> {
  const log = createLogger(correlationId);

  try {
    const event: CloudEvent<TaskCreatedEventData> = {
      specversion: '1.0',
      type: 'com.todo.task.created',
      source: 'task-service',
      id: uuidv4(),
      time: new Date().toISOString(),
      datacontenttype: 'application/json',
      data: taskData
    };

    await daprClient.pubsub.publish(PUBSUB_NAME, TOPICS.TASK_EVENTS, event);

    log.info('TaskCreated event published', {
      eventId: event.id,
      taskId: taskData.taskId,
      userId: taskData.userId
    });
  } catch (error) {
    log.error('Failed to publish TaskCreated event', { error, taskData });
    throw error;
  }
}
