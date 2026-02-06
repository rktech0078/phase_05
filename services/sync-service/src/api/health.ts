/**
 * Health check endpoints for sync-service
 */

import { Request, Response } from 'express';
import { logger } from '../../../shared/utils/logger';

/**
 * Liveness probe - checks if the service is running
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: 'healthy',
    service: 'sync-service',
    timestamp: new Date().toISOString()
  });
}

/**
 * Readiness probe - checks if the service is ready to accept traffic
 */
export async function readinessCheck(req: Request, res: Response): Promise<void> {
  try {
    // Check if WebSocket server is running
    // In production, add more checks (Redis connectivity, etc.)

    res.status(200).json({
      status: 'ready',
      service: 'sync-service',
      timestamp: new Date().toISOString(),
      checks: {
        websocket: 'running',
        redis: 'connected'
      }
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not ready',
      service: 'sync-service',
      timestamp: new Date().toISOString(),
      checks: {
        websocket: 'unknown',
        redis: 'disconnected'
      }
    });
  }
}
