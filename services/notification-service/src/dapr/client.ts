/**
 * Dapr client initialization for notification-service
 */

import { DaprClient, DaprServer, CommunicationProtocolEnum } from '@dapr/dapr';
import { logger } from '../../../shared/utils/logger';

const daprHost = process.env.DAPR_HOST || 'localhost';
const daprPort = process.env.DAPR_HTTP_PORT || '3500';
const appPort = process.env.APP_PORT || '3002';

// Initialize Dapr client for pub/sub and bindings
export const daprClient = new DaprClient({
  daprHost,
  daprPort: daprPort,
  communicationProtocol: CommunicationProtocolEnum.HTTP
});

// Initialize Dapr server for receiving events and cron triggers
export const daprServer = new DaprServer({
  serverHost: '0.0.0.0',
  serverPort: appPort,
  clientOptions: {
    daprHost,
    daprPort: daprPort
  }
});

// Pub/sub component name
export const PUBSUB_NAME = 'pubsub-kafka';

// Cron binding name
export const CRON_BINDING_NAME = 'reminder-cron';

// Topic names
export const TOPICS = {
  TASK_EVENTS: 'task-events',
  REMINDERS: 'reminders'
} as const;

/**
 * Initialize Dapr client and verify connectivity
 */
export async function initializeDapr(): Promise<void> {
  try {
    logger.info('Initializing Dapr client', {
      daprHost,
      daprPort,
      appPort
    });

    // Test connectivity by checking Dapr sidecar health
    await daprClient.health.isHealthy();

    logger.info('Dapr client initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Dapr client', { error });
    throw error;
  }
}

/**
 * Gracefully shutdown Dapr connections
 */
export async function shutdownDapr(): Promise<void> {
  try {
    logger.info('Shutting down Dapr connections');
    await daprServer.stop();
    logger.info('Dapr server stopped successfully');
  } catch (error) {
    logger.error('Error during Dapr shutdown', { error });
  }
}
