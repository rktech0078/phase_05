/**
 * Dapr client initialization for task-service
 */

import { DaprClient, DaprServer, CommunicationProtocolEnum } from '@dapr/dapr';
import { logger } from '../../../shared/utils/logger';

const daprHost = process.env.DAPR_HOST || 'localhost';
const daprPort = process.env.DAPR_HTTP_PORT || '3500';
const appPort = process.env.APP_PORT || '3001';

// Initialize Dapr client for pub/sub and state management
export const daprClient = new DaprClient({
  daprHost,
  daprPort: daprPort,
  communicationProtocol: CommunicationProtocolEnum.HTTP
});

// Initialize Dapr server for receiving events
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

// State store component name
export const STATESTORE_NAME = 'statestore';

// Topic names
export const TOPICS = {
  TASK_EVENTS: 'task-events',
  REMINDERS: 'reminders',
  TASK_UPDATES: 'task-updates'
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
