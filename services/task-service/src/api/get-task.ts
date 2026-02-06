/**
 * Get task by ID API endpoint
 */

import { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db, tasks } from '../db/connection';
import { logger, createLogger } from '../../../shared/utils/logger';
import { extractCorrelationId } from '../../../shared/utils/correlation';

export async function getTaskById(req: Request, res: Response): Promise<void> {
  const correlationId = extractCorrelationId(req.headers as Record<string, string>);
  const log = createLogger(correlationId);

  try {
    // Get user ID from auth context
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      return;
    }

    const { taskId } = req.params;

    if (!taskId) {
      res.status(400).json({ error: 'Bad Request', message: 'Task ID is required' });
      return;
    }

    // Fetch task from database
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!task) {
      res.status(404).json({ error: 'Not Found', message: 'Task not found' });
      return;
    }

    log.info('Task retrieved successfully', {
      taskId: task.id,
      userId
    });

    // Return task
    res.status(200).json({
      id: task.id,
      title: task.title,
      description: task.description,
      isCompleted: task.isCompleted,
      priority: task.priority,
      tags: task.tags,
      dueDate: task.dueDate?.toISOString(),
      recurrencePattern: task.recurrencePattern,
      userId: task.userId,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    });
  } catch (error) {
    log.error('Error retrieving task', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve task'
    });
  }
}
