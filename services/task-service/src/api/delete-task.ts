/**
 * Delete task API endpoint
 */

import { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db, tasks } from '../db/connection';
import { logger, createLogger } from '../../../shared/utils/logger';
import { extractCorrelationId } from '../../../shared/utils/correlation';

export async function deleteTask(req: Request, res: Response): Promise<void> {
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

    // Check if task exists and belongs to user
    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .limit(1);

    if (!existingTask) {
      res.status(404).json({ error: 'Not Found', message: 'Task not found' });
      return;
    }

    // Delete task from database (cascades to reminders and sets audit logs taskId to null)
    await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    log.info('Task deleted successfully', {
      taskId,
      userId
    });

    // Return success response
    res.status(200).json({
      message: 'Task deleted successfully',
      taskId
    });
  } catch (error) {
    log.error('Error deleting task', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete task'
    });
  }
}
