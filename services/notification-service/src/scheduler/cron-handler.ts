/**
 * Dapr cron binding handler for notification-service
 * Triggered every 1 minute to check for due reminders
 */

import { checkReminders } from './check-reminders';
import { logger } from '../../../shared/utils/logger';

/**
 * Handle cron trigger from Dapr binding
 */
export async function handleCronTrigger(): Promise<void> {
  try {
    logger.debug('Cron trigger received, checking for due reminders');
    await checkReminders();
  } catch (error) {
    logger.error('Error in cron handler', { error });
    // Don't throw - we want the cron to continue running
  }
}
