/**
 * Sync Service - Main entry point
 * Handles real-time WebSocket synchronization across devices
 */

import express, { Request, Response, NextFunction } from 'express';
import { initializeDapr, shutdownDapr, daprServer, PUBSUB_NAME, TOPICS } from './dapr/client';
import { ConnectionManager } from './connections/connection-manager';
import { WebSocketServer } from './websocket/server';
import { RedisClient } from './dapr/redis-client';
import { TaskUpdatesHandler } from './handlers/task-updates-handler';
import { healthCheck, readinessCheck } from './api/health';
import { logger } from '../../shared/utils/logger';
import { CloudEvent } from '../../shared/types/events';

const HTTP_PORT = process.env.APP_PORT || 3005;
const WS_PORT = process.env.WS_PORT || 3006;
const app = express();

// Initialize components
const connectionManager = new ConnectionManager();
const redisClient = new RedisClient(connectionManager);
const taskUpdatesHandler = new TaskUpdatesHandler(redisClient);
const wsServer = new WebSocketServer(Number(WS_PORT), connectionManager);

// Middleware
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });
  next();
});

// Health check endpoints
app.get('/health', healthCheck);
app.get('/ready', readinessCheck);

// Metrics endpoint
app.get('/metrics', (req: Request, res: Response) => {
  res.json({
    totalConnections: connectionManager.getTotalConnectionCount(),
    connectedUsers: connectionManager.getConnectedUserIds().length,
    subscribedChannels: redisClient.getSubscribedChannels().length
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err, path: req.path });
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Setup Dapr subscriptions
async function setupDaprHandlers(): Promise<void> {
  // Subscribe to task-updates topic
  await daprServer.pubsub.subscribe(PUBSUB_NAME, TOPICS.TASK_UPDATES, async (data: any) => {
    const event = data as CloudEvent;

    try {
      await taskUpdatesHandler.handleTaskUpdate(event);
      return { status: 'SUCCESS' };
    } catch (error) {
      logger.error('Error processing task update event', { error, eventType: event.type });
      return { status: 'RETRY' };
    }
  });

  logger.info('Dapr subscriptions configured');
}

// Setup connection lifecycle handlers
connectionManager.getConnectedUserIds = function() {
  const userIds: string[] = [];
  (this as any).connections.forEach((connections: Set<any>, userId: string) => {
    if (connections.size > 0) {
      userIds.push(userId);
    }
  });
  return userIds;
};

// Monitor connections and manage Redis subscriptions
setInterval(() => {
  const connectedUsers = connectionManager.getConnectedUserIds();
  const subscribedChannels = redisClient.getSubscribedChannels();

  // Subscribe to channels for newly connected users
  connectedUsers.forEach(async (userId) => {
    const channel = `user:${userId}:updates`;
    if (!subscribedChannels.includes(channel)) {
      await redisClient.subscribeToUser(userId);
    }
  });

  // Unsubscribe from channels for disconnected users
  subscribedChannels.forEach(async (channel) => {
    const match = channel.match(/^user:(.+):updates$/);
    if (match) {
      const userId = match[1];
      if (!connectedUsers.includes(userId)) {
        await redisClient.unsubscribeFromUser(userId);
      }
    }
  });
}, 10000); // Check every 10 seconds

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  try {
    // Stop accepting new requests
    httpServer.close(() => {
      logger.info('HTTP server closed');
    });

    // Close WebSocket server
    await wsServer.close();

    // Close Redis connections
    await redisClient.close();

    // Shutdown Dapr connections
    await shutdownDapr();

    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start servers
let httpServer: any;

async function startServer(): Promise<void> {
  try {
    // Initialize Dapr client
    await initializeDapr();

    // Setup Dapr handlers
    await setupDaprHandlers();

    // Start Dapr server
    await daprServer.start();

    // Start WebSocket heartbeat
    wsServer.startHeartbeat();

    // Start HTTP server
    httpServer = app.listen(HTTP_PORT, () => {
      logger.info(`Sync service started`, {
        httpPort: HTTP_PORT,
        wsPort: WS_PORT,
        environment: process.env.NODE_ENV || 'development'
      });
    });
  } catch (error) {
    logger.error('Failed to start sync service', { error });
    process.exit(1);
  }
}

// Start the service
startServer();
