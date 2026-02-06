/**
 * Database connection using Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { tasks, user, reminders, auditLogs } from '../../../shared/schemas';
import { logger } from '../../../shared/utils/logger';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create PostgreSQL connection
const queryClient = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10
});

// Initialize Drizzle ORM
export const db = drizzle(queryClient, {
  schema: { tasks, user, reminders, auditLogs }
});

// Export schema for use in queries
export { tasks, user, reminders, auditLogs };

/**
 * Test database connectivity
 */
export async function testConnection(): Promise<void> {
  try {
    await queryClient`SELECT 1`;
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
    throw error;
  }
}

/**
 * Close database connection
 */
export async function closeConnection(): Promise<void> {
  try {
    await queryClient.end();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection', { error });
  }
}
