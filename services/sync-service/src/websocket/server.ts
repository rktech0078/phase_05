/**
 * WebSocket server for real-time task synchronization
 */

import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { ConnectionManager } from '../connections/connection-manager';
import { authenticateWebSocket } from './auth';
import { logger } from '../../../shared/utils/logger';

export class WebSocketServer {
  private wss: WebSocket.Server;
  private connectionManager: ConnectionManager;

  constructor(port: number, connectionManager: ConnectionManager) {
    this.connectionManager = connectionManager;
    this.wss = new WebSocket.Server({ port });

    this.setupEventHandlers();
    logger.info('WebSocket server initialized', { port });
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      this.handleConnection(ws, req);
    });

    this.wss.on('error', (error: Error) => {
      logger.error('WebSocket server error', { error });
    });
  }

  private async handleConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    try {
      // Authenticate WebSocket connection
      const userId = await authenticateWebSocket(req);

      if (!userId) {
        logger.warn('WebSocket authentication failed', {
          ip: req.socket.remoteAddress
        });
        ws.close(1008, 'Authentication failed');
        return;
      }

      logger.info('WebSocket connection established', { userId });

      // Add connection to manager
      this.connectionManager.addConnection(userId, ws);

      // Setup connection event handlers
      ws.on('message', (message: string) => {
        this.handleMessage(userId, message);
      });

      ws.on('close', (code: number, reason: string) => {
        this.handleClose(userId, ws, code, reason);
      });

      ws.on('error', (error: Error) => {
        logger.error('WebSocket connection error', { userId, error });
      });

      ws.on('pong', () => {
        // Update last activity timestamp
        (ws as any).isAlive = true;
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        userId,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      logger.error('Error handling WebSocket connection', { error });
      ws.close(1011, 'Internal server error');
    }
  }

  private handleMessage(userId: string, message: string): void {
    try {
      const data = JSON.parse(message);
      logger.debug('WebSocket message received', { userId, type: data.type });

      // Handle different message types
      switch (data.type) {
        case 'ping':
          // Respond with pong
          this.connectionManager.sendToUser(userId, {
            type: 'pong',
            timestamp: new Date().toISOString()
          });
          break;

        default:
          logger.warn('Unknown message type', { userId, type: data.type });
      }
    } catch (error) {
      logger.error('Error handling WebSocket message', { userId, error });
    }
  }

  private handleClose(userId: string, ws: WebSocket, code: number, reason: string): void {
    logger.info('WebSocket connection closed', {
      userId,
      code,
      reason: reason.toString()
    });

    this.connectionManager.removeConnection(userId, ws);
  }

  /**
   * Start heartbeat interval to detect dead connections
   */
  public startHeartbeat(interval: number = 30000): void {
    setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        if ((ws as any).isAlive === false) {
          logger.info('Terminating dead WebSocket connection');
          return ws.terminate();
        }

        (ws as any).isAlive = false;
        ws.ping();
      });
    }, interval);

    logger.info('WebSocket heartbeat started', { interval });
  }

  /**
   * Gracefully close all connections
   */
  public async close(): Promise<void> {
    return new Promise((resolve) => {
      logger.info('Closing WebSocket server');

      // Close all client connections
      this.wss.clients.forEach((ws: WebSocket) => {
        ws.close(1000, 'Server shutting down');
      });

      // Close server
      this.wss.close(() => {
        logger.info('WebSocket server closed');
        resolve();
      });
    });
  }

  /**
   * Get number of active connections
   */
  public getConnectionCount(): number {
    return this.wss.clients.size;
  }
}
