/**
 * Generate next task instance for recurring tasks
 */

import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { db, tasks } from '../db/connection';
import { calculateNextDate, RecurrencePattern } from '../patterns/calculate-next-date';
import { publishRecurringTaskGeneratedEvent } from '../handlers/publish-recurring-generated';
import { logger, createLogger } from '../../../shared/utils/logger';

/**
 * Generate the next instance of a recurring task
 */
export async function generateNextInstance(
  originalTaskId: string,
  userId: string,
  currentDueDate: Date,
  recurrencePattern: RecurrencePattern,
  correlationId?: string
): Promise<void> {
  const log = createLogger(correlationId);

  try {
    // Fetch original task details
    const [originalTask] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, originalTaskId))
      .limit(1);

    if (!originalTask) {
      log.error('Original task not found', { originalTaskId });
      throw new Error(`Original task not found: ${originalTaskId}`);
    }

    // Calculate next due date
    const nextDueDate = calculateNextDate(currentDueDate, recurrencePattern);

    log.info('Calculated next due date', {
      originalTaskId,
      currentDueDate: currentDueDate.toISOString(),
      nextDueDate: nextDueDate.toISOString(),
      recurrencePattern
    });

    // Create new task instance
    const newTaskId = uuidv4();
    const [newTask] = await db.insert(tasks).values({
      id: newTaskId,
      title: originalTask.title,
      description: originalTask.description,
      priority: originalTask.priority,
      tags: originalTask.tags,
      dueDate: nextDueDate,
      recurrencePattern: originalTask.recurrencePattern,
      userId,
      isCompleted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    log.info('New recurring task instance created', {
      originalTaskId,
      newTaskId: newTask.id,
      nextDueDate: nextDueDate.toISOString()
    });

    // Publish RecurringTaskGenerated event
    await publishRecurringTaskGeneratedEvent({
      originalTaskId,
      newTaskId: newTask.id,
      userId,
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      tags: newTask.tags,
      dueDate: newTask.dueDate!.toISOString(),
      recurrencePattern: newTask.recurrencePattern as 'daily' | 'weekly' | 'monthly'
    }, correlationId);
  } catch (error) {
    log.error('Error generating next task instance', {
      error,
      originalTaskId,
      recurrencePattern
    });
    throw error;
  }
}
