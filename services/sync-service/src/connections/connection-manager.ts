/**
 * Connection manager for WebSocket connections
 * Manages user connections and message broadcasting
 */

import WebSocket from 'ws';
import { logger } from '../../../shared/utils/logger';

export class ConnectionManager {
  // Map of userId -> Set of WebSocket connections
  private connections: Map<string, Set<WebSocket>>;

  constructor() {
    this.connections = new Map();
  }

  /**
   * Add a WebSocket connection for a user
   */
  public addConnection(userId: string, ws: WebSocket): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    this.connections.get(userId)!.add(ws);

    logger.info('Connection added', {
      userId,
      totalConnections: this.connections.get(userId)!.size
    });
  }

  /**
   * Remove a WebSocket connection for a user
   */
  public removeConnection(userId: string, ws: WebSocket): void {
    const userConnections = this.connections.get(userId);

    if (!userConnections) {
      return;
    }

    userConnections.delete(ws);

    if (userConnections.size === 0) {
      this.connections.delete(userId);
      logger.info('All connections removed for user', { userId });
    } else {
      logger.info('Connection removed', {
        userId,
        remainingConnections: userConnections.size
      });
    }
  }

  /**
   * Send message to all connections of a specific user
   */
  public sendToUser(userId: string, data: any): void {
    const userConnections = this.connections.get(userId);

    if (!userConnections || userConnections.size === 0) {
      logger.debug('No connections found for user', { userId });
      return;
    }

    const message = JSON.stringify(data);
    let sentCount = 0;

    userConnections.forEach((ws: WebSocket) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
          sentCount++;
        } catch (error) {
          logger.error('Error sending message to connection', { userId, error });
        }
      }
    });

    logger.debug('Message sent to user connections', {
      userId,
      sentCount,
      totalConnections: userConnections.size
    });
  }

  /**
   * Broadcast message to all connections of multiple users
   */
  public broadcastToUsers(userIds: string[], data: any): void {
    userIds.forEach(userId => {
      this.sendToUser(userId, data);
    });
  }

  /**
   * Get all connected user IDs
   */
  public getConnectedUserIds(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Get connection count for a specific user
   */
  public getUserConnectionCount(userId: string): number {
    return this.connections.get(userId)?.size || 0;
  }

  /**
   * Get total connection count across all users
   */
  public getTotalConnectionCount(): number {
    let total = 0;
    this.connections.forEach(userConnections => {
      total += userConnections.size;
    });
    return total;
  }

  /**
   * Check if a user has any active connections
   */
  public hasConnections(userId: string): boolean {
    const userConnections = this.connections.get(userId);
    return userConnections !== undefined && userConnections.size > 0;
  }

  /**
   * Close all connections for a user
   */
  public closeUserConnections(userId: string, code: number = 1000, reason: string = 'Closing'): void {
    const userConnections = this.connections.get(userId);

    if (!userConnections) {
      return;
    }

    userConnections.forEach((ws: WebSocket) => {
      try {
        ws.close(code, reason);
      } catch (error) {
        logger.error('Error closing connection', { userId, error });
      }
    });

    this.connections.delete(userId);
    logger.info('All connections closed for user', { userId });
  }

  /**
   * Close all connections
   */
  public closeAllConnections(code: number = 1000, reason: string = 'Server shutting down'): void {
    this.connections.forEach((userConnections, userId) => {
      this.closeUserConnections(userId, code, reason);
    });

    logger.info('All connections closed');
  }
}
