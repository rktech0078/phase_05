/**
 * Get user tasks API endpoint
 */

import { Request, Response } from 'express';
import { eq, and, desc, asc, lte, gte, sql, or, ilike } from 'drizzle-orm';
import { db, tasks } from '../db/connection';
import { getTasksQuerySchema } from '../models/task-validation';
import { logger, createLogger } from '../../../shared/utils/logger';
import { extractCorrelationId } from '../../../shared/utils/correlation';

export async function getUserTasks(req: Request, res: Response): Promise<void> {
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
    const validationResult = getTasksQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid query parameters',
        details: validationResult.error.errors
      });
      return;
    }

    const query = validationResult.data;

    // Build where conditions
    const conditions = [eq(tasks.userId, userId)];

    if (query.priority) {
      conditions.push(eq(tasks.priority, query.priority));
    }

    if (query.isCompleted !== undefined) {
      conditions.push(eq(tasks.isCompleted, query.isCompleted));
    }

    if (query.dueBefore) {
      conditions.push(lte(tasks.dueDate, new Date(query.dueBefore)));
    }

    if (query.dueAfter) {
      conditions.push(gte(tasks.dueDate, new Date(query.dueAfter)));
    }

    if (query.overdue) {
      conditions.push(
        and(
          lte(tasks.dueDate, new Date()),
          eq(tasks.isCompleted, false)
        )!
      );
    }

    if (query.tags && query.tags.length > 0) {
      // Check if any of the query tags exist in the task's tags array
      const tagConditions = query.tags.map(tag =>
        sql`${tasks.tags} @> ARRAY[${tag}]::text[]`
      );
      conditions.push(or(...tagConditions)!);
    }

    // Build order by clause
    let orderByClause;
    if (query.sortBy === 'dueDate') {
      orderByClause = query.sortOrder === 'asc' ? asc(tasks.dueDate) : desc(tasks.dueDate);
    } else if (query.sortBy === 'priority') {
      // Custom priority ordering: high > medium > low
      orderByClause = query.sortOrder === 'asc'
        ? sql`CASE ${tasks.priority} WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 END`
        : sql`CASE ${tasks.priority} WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END`;
    } else {
      orderByClause = query.sortOrder === 'asc' ? asc(tasks.createdAt) : desc(tasks.createdAt);
    }

    // Execute query
    const userTasks = await db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(query.limit)
      .offset(query.offset);

    // Get total count for pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(...conditions));

    log.info('Tasks retrieved successfully', {
      userId,
      count: userTasks.length,
      total: count
    });

    // Return tasks with pagination info
    res.status(200).json({
      data: userTasks.map(task => ({
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
      limit: query.limit,
      offset: query.offset
    });
  } catch (error) {
    log.error('Error retrieving tasks', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve tasks'
    });
  }
}
