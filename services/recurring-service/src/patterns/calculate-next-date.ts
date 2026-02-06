/**
 * Recurrence pattern calculation logic
 * Calculates the next due date based on recurrence pattern
 */

import { logger } from '../../../shared/utils/logger';

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';

/**
 * Calculate the next due date based on recurrence pattern
 */
export function calculateNextDate(
  currentDueDate: Date,
  pattern: RecurrencePattern
): Date {
  const nextDate = new Date(currentDueDate);

  switch (pattern) {
    case 'daily':
      // Add 1 day
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case 'weekly':
      // Add 7 days
      nextDate.setDate(nextDate.getDate() + 7);
      break;

    case 'monthly':
      // Add 1 month
      // Handle edge cases (e.g., Jan 31 -> Feb 28/29)
      const currentMonth = nextDate.getMonth();
      const currentDay = nextDate.getDate();

      nextDate.setMonth(currentMonth + 1);

      // If day changed (e.g., Jan 31 -> Mar 3), set to last day of target month
      if (nextDate.getDate() !== currentDay) {
        nextDate.setDate(0); // Set to last day of previous month
      }
      break;

    default:
      logger.error('Invalid recurrence pattern', { pattern });
      throw new Error(`Invalid recurrence pattern: ${pattern}`);
  }

  return nextDate;
}

/**
 * Calculate multiple future dates for a recurrence pattern
 */
export function calculateFutureDates(
  startDate: Date,
  pattern: RecurrencePattern,
  count: number
): Date[] {
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  for (let i = 0; i < count; i++) {
    currentDate = calculateNextDate(currentDate, pattern);
    dates.push(new Date(currentDate));
  }

  return dates;
}

/**
 * Validate if a date is a valid recurrence date
 */
export function isValidRecurrenceDate(date: Date): boolean {
  // Check if date is in the future
  return date > new Date();
}
