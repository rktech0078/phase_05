import { db } from './db';
import { tasks, user as userSchema } from '../schemas';
import { eq, and, SQL } from 'drizzle-orm';
import { validateTask } from './validation';
import { logger } from './error';

// Create a new task
export const createTask = async (userId: string, taskData: { title: string; description?: string }) => {
  logger.info(`Creating task for user ID: ${userId}`);

  // Validate task data
  const validation = validateTask(taskData);
  if (!validation.isValid) {
    const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
    logger.error(`Task creation validation failed for user ${userId}: ${error.message}`);
    throw error;
  }

  try {
    // Verify user exists
    const [user] = await db.select().from(userSchema).where(eq(userSchema.id, userId)).limit(1);
    if (!user) {
      throw new Error('User not found');
    }

    const [newTask] = await db.insert(tasks).values({
      userId,
      title: taskData.title,
      description: taskData.description,
    }).returning();

    logger.info(`Successfully created task with ID: ${newTask.id} for user: ${userId}`);
    return newTask;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error creating task for user ${userId}: ${errorMessage}`);
    throw error;
  }
};

// Get all tasks for a user
export const getUserTasks = async (userId: string, completed?: boolean) => {
  logger.info(`Fetching tasks for user ID: ${userId}, completed filter: ${completed}`);

  try {
    const conditions: SQL[] = [eq(tasks.userId, userId)];

    if (completed !== undefined) {
      conditions.push(eq(tasks.isCompleted, completed));
    }

    const userTasks = await db.select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(tasks.createdAt);

    logger.info(`Successfully fetched ${userTasks.length} tasks for user: ${userId}`);
    return userTasks;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching tasks for user ${userId}: ${errorMessage}`);
    throw error;
  }
};

// Get a specific task
export const getTaskById = async (taskId: string, userId: string) => {
  logger.info(`Fetching task ID: ${taskId} for user ID: ${userId}`);

  try {
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    if (!task) {
      logger.warn(`Task with ID ${taskId} not found for user ${userId}`);
      return null;
    }

    logger.info(`Successfully fetched task ID: ${taskId} for user: ${userId}`);
    return task;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error fetching task ${taskId} for user ${userId}: ${errorMessage}`);
    throw error;
  }
};

// Update a task
export const updateTask = async (
  taskId: string,
  userId: string,
  taskData: { title?: string; description?: string; isCompleted?: boolean }
) => {
  logger.info(`Updating task ID: ${taskId} for user ID: ${userId}`);

  try {
    // Validate task data if title is being updated
    if (taskData.title) {
      const validation = validateTask({ title: taskData.title, description: taskData.description });
      if (!validation.isValid) {
        const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
        logger.error(`Task update validation failed for task ${taskId}: ${error.message}`);
        throw error;
      }
    }

    const [updatedTask] = await db
      .update(tasks)
      .set({
        ...taskData,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    if (!updatedTask) {
      logger.warn(`Task with ID ${taskId} not found for user ${userId} during update`);
      throw new Error('Task not found');
    }

    logger.info(`Successfully updated task ID: ${updatedTask.id} for user: ${userId}`);
    return updatedTask;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error updating task ${taskId} for user ${userId}: ${errorMessage}`);
    throw error;
  }
};

// Delete a task
export const deleteTask = async (taskId: string, userId: string) => {
  logger.info(`Deleting task ID: ${taskId} for user ID: ${userId}`);

  try {
    const result = await db
      .delete(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));

    if (result.rowCount === 0) {
      logger.warn(`Task with ID ${taskId} not found for user ${userId} during deletion`);
      throw new Error('Task not found');
    }

    logger.info(`Successfully deleted task ID: ${taskId} for user: ${userId}`);
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error deleting task ${taskId} for user ${userId}: ${errorMessage}`);
    throw error;
  }
};

// Toggle task completion status
export const toggleTaskCompletion = async (taskId: string, userId: string, isCompleted: boolean) => {
  logger.info(`Toggling completion status for task ID: ${taskId}, user ID: ${userId}, setting to: ${isCompleted}`);

  try {
    const [updatedTask] = await db
      .update(tasks)
      .set({
        isCompleted,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();

    if (!updatedTask) {
      logger.warn(`Task with ID ${taskId} not found for user ${userId} during completion toggle`);
      throw new Error('Task not found');
    }

    logger.info(`Successfully updated completion status for task ID: ${updatedTask.id}, user: ${userId}, status: ${isCompleted}`);
    return updatedTask;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error toggling completion status for task ${taskId}, user ${userId}: ${errorMessage}`);
    throw error;
  }
};