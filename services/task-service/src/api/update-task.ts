/**
 * Update task API endpoint
 */

import { Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db, tasks } from '../db/connection';
import { updateTaskSchema } from '../models/task-validation';
import { logger, createLogger } from '../../../shared/utils/logger';
import { extractCorrelationId } from '../../../shared/utils/correlation';

export async function updateTask(req: Request, res: Response): Promise<void> {
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

    // Validate request body
    const validationResult = updateTaskSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: validationResult.error.errors
      });
      return;
    }

    const updateData = validationResult.data;

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

    // Build update object
    const updateObject: any = {
      updatedAt: new Date()
    };

    if (updateData.title !== undefined) updateObject.title = updateData.title;
    if (updateData.description !== undefined) updateObject.description = updateData.description;
    if (updateData.priority !== undefined) updateObject.priority = updateData.priority;
    if (updateData.tags !== undefined) updateObject.tags = updateData.tags;
    if (updateData.dueDate !== undefined) {
      updateObject.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
    }
    if (updateData.recurrencePattern !== undefined) updateObject.recurrencePattern = updateData.recurrencePattern;

    // Update task in database
    const [updatedTask] = await db
      .update(tasks)
      .set(updateObject)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    log.info('Task updated successfully', {
      taskId: updatedTask.id,
      userId,
      changes: Object.keys(updateObject)
    });

    // Return updated task
    res.status(200).json({
      id: updatedTask.id,
      title: updatedTask.title,
      description: updatedTask.description,
      isCompleted: updatedTask.isCompleted,
      priority: updatedTask.priority,
      tags: updatedTask.tags,
      dueDate: updatedTask.dueDate?.toISOString(),
      recurrencePattern: updatedTask.recurrencePattern,
      userId: updatedTask.userId,
      createdAt: updatedTask.createdAt.toISOString(),
      updatedAt: updatedTask.updatedAt.toISOString()
    });
  } catch (error) {
    log.error('Error updating task', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update task'
    });
  }
}
