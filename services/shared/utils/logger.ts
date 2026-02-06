/**
 * Structured logging utility using Winston
 */

import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME || 'unknown-service',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, correlationId, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          const corrId = correlationId ? `[${correlationId}]` : '';
          return `${timestamp} [${service}] ${level} ${corrId}: ${message} ${metaStr}`;
        })
      )
    })
  ]
});

// Helper function to create child logger with correlation ID
export function createLogger(correlationId?: string) {
  if (correlationId) {
    return logger.child({ correlationId });
  }
  return logger;
}

export default logger;
