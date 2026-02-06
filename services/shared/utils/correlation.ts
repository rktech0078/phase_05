/**
 * Correlation ID generation and management for distributed tracing
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return uuidv4();
}

/**
 * Extract correlation ID from request headers
 */
export function extractCorrelationId(headers: Record<string, string | string[] | undefined>): string {
  const correlationId = headers['x-correlation-id'] || headers['X-Correlation-ID'];

  if (Array.isArray(correlationId)) {
    return correlationId[0] || generateCorrelationId();
  }

  return correlationId || generateCorrelationId();
}

/**
 * Add correlation ID to headers
 */
export function addCorrelationIdToHeaders(
  headers: Record<string, string>,
  correlationId: string
): Record<string, string> {
  return {
    ...headers,
    'x-correlation-id': correlationId
  };
}
