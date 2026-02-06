/**
 * Create task API endpoint
 */

import { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db, tasks } from '../db/connection';
import { createTaskSchema } from '../models/task-validation';
import { logger, createLogger } from '../../../shared/utils/logger';
import { extractCorrelationId } from '../../../shared/utils/correlation';

export async function createTask(req: Request, res: Response): Promise<void> {
  const correlationId = extractCorrelationId(req.headers as Record<string, string>);
  const log = createLogger(correlationId);

  try {
    // Get user ID from auth context (assuming Better Auth middleware sets req.user)
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      return;
    }

    // Validate request body
    const validationResult = createTaskSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: validationResult.error.errors
      });
      return;
    }

    const taskData = validationResult.data;

    // Create task in database
    const [newTask] = await db.insert(tasks).values({
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      tags: taskData.tags,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      recurrencePattern: taskData.recurrencePattern,
      userId,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    log.info('Task created successfully', {
      taskId: newTask.id,
      userId,
      title: newTask.title
    });

    // Return created task
    res.status(201).json({
      id: newTask.id,
      title: newTask.title,
      description: newTask.description,
      isCompleted: newTask.isCompleted,
      priority: newTask.priority,
      tags: newTask.tags,
      dueDate: newTask.dueDate?.toISOString(),
      recurrencePattern: newTask.recurrencePattern,
      userId: newTask.userId,
      createdAt: newTask.createdAt.toISOString(),
      updatedAt: newTask.updatedAt.toISOString()
    });
  } catch (error) {
    log.error('Error creating task', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create task'
    });
  }
}
