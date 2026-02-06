/**
 * Redis pub/sub client for WebSocket broadcasting
 * Enables horizontal scaling by broadcasting events across all sync-service replicas
 */

import Redis from 'ioredis';
import { ConnectionManager } from '../connections/connection-manager';
import { logger } from '../../../shared/utils/logger';

export class RedisClient {
  private publisher: Redis;
  private subscriber: Redis;
  private connectionManager: ConnectionManager;
  private subscribedChannels: Set<string>;

  constructor(connectionManager: ConnectionManager) {
    const redisHost = process.env.REDIS_HOST || 'redis-master.infrastructure.svc.cluster.local';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    this.publisher = new Redis({
      host: redisHost,
      port: redisPort,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.subscriber = new Redis({
      host: redisHost,
      port: redisPort,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.connectionManager = connectionManager;
    this.subscribedChannels = new Set();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.publisher.on('connect', () => {
      logger.info('Redis publisher connected');
    });

    this.publisher.on('error', (error: Error) => {
      logger.error('Redis publisher error', { error });
    });

    this.subscriber.on('connect', () => {
      logger.info('Redis subscriber connected');
    });

    this.subscriber.on('error', (error: Error) => {
      logger.error('Redis subscriber error', { error });
    });

    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message);
    });
  }

  /**
   * Subscribe to a Redis channel for a user
   */
  public async subscribeToUser(userId: string): Promise<void> {
    const channel = `user:${userId}:updates`;

    if (this.subscribedChannels.has(channel)) {
      return;
    }

    await this.subscriber.subscribe(channel);
    this.subscribedChannels.add(channel);

    logger.info('Subscribed to Redis channel', { channel, userId });
  }

  /**
   * Unsubscribe from a Redis channel for a user
   */
  public async unsubscribeFromUser(userId: string): Promise<void> {
    const channel = `user:${userId}:updates`;

    if (!this.subscribedChannels.has(channel)) {
      return;
    }

    await this.subscriber.unsubscribe(channel);
    this.subscribedChannels.delete(channel);

    logger.info('Unsubscribed from Redis channel', { channel, userId });
  }

  /**
   * Publish message to a user's Redis channel
   */
  public async publishToUser(userId: string, data: any): Promise<void> {
    const channel = `user:${userId}:updates`;
    const message = JSON.stringify(data);

    await this.publisher.publish(channel, message);

    logger.debug('Published to Redis channel', { channel, userId });
  }

  /**
   * Handle incoming Redis messages
   */
  private handleMessage(channel: string, message: string): void {
    try {
      // Extract userId from channel name (format: user:{userId}:updates)
      const match = channel.match(/^user:(.+):updates$/);
      if (!match) {
        logger.warn('Invalid channel format', { channel });
        return;
      }

      const userId = match[1];
      const data = JSON.parse(message);

      // Broadcast to all WebSocket connections for this user on this replica
      this.connectionManager.sendToUser(userId, data);

      logger.debug('Redis message broadcasted to WebSocket connections', {
        channel,
        userId
      });
    } catch (error) {
      logger.error('Error handling Redis message', { error, channel });
    }
  }

  /**
   * Close Redis connections
   */
  public async close(): Promise<void> {
    logger.info('Closing Redis connections');

    await this.publisher.quit();
    await this.subscriber.quit();

    logger.info('Redis connections closed');
  }

  /**
   * Get list of subscribed channels
   */
  public getSubscribedChannels(): string[] {
    return Array.from(this.subscribedChannels);
  }
}
