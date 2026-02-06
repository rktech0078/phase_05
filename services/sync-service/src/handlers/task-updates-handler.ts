/**
 * Task updates event handler for sync-service
 * Receives task update events and broadcasts to connected clients via Redis
 */

import { CloudEvent } from '../../../shared/types/events';
import { RedisClient } from '../dapr/redis-client';
import { logger, createLogger } from '../../../shared/utils/logger';

export class TaskUpdatesHandler {
  private redisClient: RedisClient;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
  }

  /**
   * Handle task update event from Kafka
   */
  public async handleTaskUpdate(event: CloudEvent): Promise<void> {
    const log = createLogger(event.id);

    try {
      const { userId, taskId } = event.data;

      if (!userId) {
        log.warn('Task update event missing userId', { eventType: event.type });
        return;
      }

      // Prepare WebSocket message
      const wsMessage = {
        type: 'task-update',
        event: event.type,
        taskId,
        data: event.data,
        timestamp: event.time
      };

      // Publish to Redis channel for the user
      // This will be received by all sync-service replicas
      // Each replica will broadcast to its local WebSocket connections
      await this.redisClient.publishToUser(userId, wsMessage);

      log.info('Task update published to Redis', {
        userId,
        taskId,
        eventType: event.type
      });
    } catch (error) {
      log.error('Error handling task update', { error, event });
      throw error;
    }
  }
}
