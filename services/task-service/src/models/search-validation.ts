/**
 * Search tasks query validation schema
 */

import { z } from 'zod';

export const searchTasksQuerySchema = z.object({
  query: z.string().min(1, 'Search query is required').max(200, 'Query must be 200 characters or less'),
  limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).default('50'),
  offset: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(0)).default('0')
});

export type SearchTasksQuery = z.infer<typeof searchTasksQuerySchema>;
