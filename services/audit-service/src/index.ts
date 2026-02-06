/**
 * Audit Service - Main entry point
 * Handles comprehensive audit logging for all task operations
 */

import express, { Request, Response, NextFunction } from 'express';
import { initializeDapr, shutdownDapr, daprServer, PUBSUB_NAME, TOPICS } from './dapr/client';
import { testConnection, closeConnection } from './db/connection';
import { handleTaskEvents } from './handlers/task-events-handler';
import { getTaskAuditHistory } from './api/get-task-audit';
import { getUserActivityHistory } from './api/get-user-activity';
import { healthCheck, readinessCheck } from './api/health';
import { logger } from '../../shared/utils/logger';
import { CloudEvent } from '../../shared/types/events';

const PORT = process.env.APP_PORT || 3004;
const app = express();

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

// Audit API endpoints
app.get('/audit/tasks/:taskId', getTaskAuditHistory);
app.get('/audit/activity', getUserActivityHistory);

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
  // Subscribe to task-events topic
  await daprServer.pubsub.subscribe(PUBSUB_NAME, TOPICS.TASK_EVENTS, async (data: any) => {
    const event = data as CloudEvent;

    try {
      await handleTaskEvents(event);
      return { status: 'SUCCESS' };
    } catch (error) {
      logger.error('Error processing task event', { error, eventType: event.type });
      return { status: 'RETRY' };
    }
  });

  logger.info('Dapr subscriptions configured');
}

// Graceful shutdown handler
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal}, starting graceful shutdown`);

  try {
    // Stop accepting new requests
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Shutdown Dapr connections
    await shutdownDapr();

    // Close database connection
    await closeConnection();

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

// Start server
let server: any;

async function startServer(): Promise<void> {
  try {
    // Initialize Dapr client
    await initializeDapr();

    // Test database connection
    await testConnection();

    // Setup Dapr handlers
    await setupDaprHandlers();

    // Start Dapr server
    await daprServer.start();

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`Audit service started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      });
    });
  } catch (error) {
    logger.error('Failed to start audit service', { error });
    process.exit(1);
  }
}

// Start the service
startServer();
