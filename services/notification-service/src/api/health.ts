/**
 * Health check endpoints for notification-service
 */

import { Request, Response } from 'express';
import { db } from '../db/connection';
import { logger } from '../../../shared/utils/logger';

/**
 * Liveness probe - checks if the service is running
 */
export async function healthCheck(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    status: 'healthy',
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
}

/**
 * Readiness probe - checks if the service is ready to accept traffic
 */
export async function readinessCheck(req: Request, res: Response): Promise<void> {
  try {
    // Check database connectivity
    await db.execute('SELECT 1' as any);

    res.status(200).json({
      status: 'ready',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected'
      }
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      status: 'not ready',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'disconnected'
      }
    });
  }
}
