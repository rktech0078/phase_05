/**
 * Task Service - Main entry point
 * Handles CRUD operations for tasks and publishes events
 */

import express, { Request, Response, NextFunction } from 'express';
import { initializeDapr, shutdownDapr, daprServer } from './dapr/client';
import { testConnection, closeConnection } from './db/connection';
import { createTask } from './api/create-task';
import { getUserTasks } from './api/get-tasks';
import { getTaskById } from './api/get-task';
import { updateTask } from './api/update-task';
import { deleteTask } from './api/delete-task';
import { toggleTaskCompletion } from './api/complete-task';
import { healthCheck, readinessCheck } from './api/health';
import { logger } from '../../shared/utils/logger';

const PORT = process.env.APP_PORT || 3001;
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

// Task API endpoints
app.post('/tasks', createTask);
app.get('/tasks', getUserTasks);
app.get('/tasks/:taskId', getTaskById);
app.put('/tasks/:taskId', updateTask);
app.delete('/tasks/:taskId', deleteTask);
app.patch('/tasks/:taskId/complete', toggleTaskCompletion);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err, path: req.path });
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

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

    // Start Dapr server for subscriptions
    await daprServer.start();

    // Start HTTP server
    server = app.listen(PORT, () => {
      logger.info(`Task service started`, {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      });
    });
  } catch (error) {
    logger.error('Failed to start task service', { error });
    process.exit(1);
  }
}

// Start the service
startServer();
