/**
 * Search tasks API endpoint
 */

import { Request, Response } from 'express';
import { eq, and, or, ilike, sql } from 'drizzle-orm';
import { db, tasks } from '../db/connection';
import { searchTasksQuerySchema } from '../models/task-validation';
import { logger, createLogger } from '../../../shared/utils/logger';
import { extractCorrelationId } from '../../../shared/utils/correlation';

export async function searchTasks(req: Request, res: Response): Promise<void> {
  const correlationId = extractCorrelationId(req.headers as Record<string, string>);
  const log = createLogger(correlationId);

  try {
    // Get user ID from auth context
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      return;
    }

    // Validate query parameters
    const validationResult = searchTasksQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: validationResult.error.errors
      });
      return;
    }

    const { query, limit, offset } = validationResult.data;

    // Build search conditions (search in title and description)
    const searchPattern = `%${query}%`;
    const searchConditions = and(
      eq(tasks.userId, userId),
      or(
        ilike(tasks.title, searchPattern),
        ilike(tasks.description, searchPattern)
      )
    );

    // Execute search query
    const searchResults = await db
      .select()
      .from(tasks)
      .where(searchConditions)
      .orderBy(sql`
        CASE
          WHEN ${tasks.title} ILIKE ${searchPattern} THEN 1
          WHEN ${tasks.description} ILIKE ${searchPattern} THEN 2
          ELSE 3
        END
      `)
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(searchConditions);

    log.info('Tasks search completed', {
      userId,
      query,
      count: searchResults.length,
      total: count
    });

    // Return search results with pagination info
    res.status(200).json({
      data: searchResults.map(task => ({
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
      })),
      total: Number(count),
      limit,
      offset,
      query
    });
  } catch (error) {
    log.error('Error searching tasks', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to search tasks'
    });
  }
}
