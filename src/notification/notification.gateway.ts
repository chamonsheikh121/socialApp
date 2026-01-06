/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

/**
 * WebSocket Gateway for real-time notifications
 * Handles WebSocket connections and broadcasts notifications to users
 * FULLY INTEGRATED with NotificationService for database persistence
 *
 * Methods:
 * - Connection/Disconnection management
 * - Real-time push via WebSocket
 * - Database persistence via NotificationService
 * - Hybrid approach: Save to DB + Push in real-time
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
})
@Injectable()
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() private readonly server!: Server;

  private readonly logger = new Logger('NotificationGateway');
  private readonly userConnections = new Map<string, Set<string>>();

  constructor(private readonly notificationService: NotificationService) {}

  /**
   * Handle new WebSocket connection
   */
  handleConnection(socket: Socket): void {
    this.logger.log(`Client connected: ${socket.id}`);
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnect(socket: Socket): void {
    this.logger.log(`Client disconnected: ${socket.id}`);

    // Remove socket from all user connections
    for (const [, socketIds] of this.userConnections) {
      socketIds.delete(socket.id);
    }
  }

  /**
   * Subscribe user to their notification room
   * Called when user logs in or connects from a new device
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: Record<string, unknown>,
  ): void {
    const userId = data.userId as string | undefined;

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      this.logger.warn('Invalid userId provided for subscription');
      socket.emit('error', { message: 'Invalid userId' });
      return;
    }

    const cleanUserId = userId.trim();

    // Track this socket connection for the user
    if (!this.userConnections.has(cleanUserId)) {
      this.userConnections.set(cleanUserId, new Set<string>());
    }
    this.userConnections.get(cleanUserId)!.add(socket.id);

    // Join socket to user-specific room
    socket.join(`user_${cleanUserId}`);

    this.logger.log(`User ${cleanUserId} subscribed (socket: ${socket.id})`);

    // Emit subscription confirmation
    socket.emit('subscribed', { userId: cleanUserId });
  }

  /**
   * Unsubscribe user from their notification room
   * Called when user logs out or closes connection
   */
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: Record<string, unknown>,
  ): void {
    const userId = data.userId as string | undefined;

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      this.logger.warn('Invalid userId provided for unsubscription');
      return;
    }

    const cleanUserId = userId.trim();

    // Remove socket from user connections
    const socketIds = this.userConnections.get(cleanUserId);
    if (socketIds) {
      socketIds.delete(socket.id);

      // Clean up empty sets
      if (socketIds.size === 0) {
        this.userConnections.delete(cleanUserId);
      }
    }

    // Leave user-specific room
    socket.leave(`user_${cleanUserId}`);

    this.logger.log(`User ${cleanUserId} unsubscribed (socket: ${socket.id})`);
  }

  // ============================================
  // DATABASE + WEBSOCKET INTEGRATION METHODS
  // These methods save to database AND push real-time
  // ============================================

  /**
   * Create notification in database AND push to single user
   *
   * **When used:**
   * - From any service that needs persistent notifications
   * - Called after like, comment, follow events
   * - Requires saving to database for history/retrieval
   *
   * @param createNotificationDto - DTO with notification data
   * @returns Created notification with all details
   */
  async createAndPushNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<any> {
    try {
      // 1. Create notification in database
      const savedNotification = await this.notificationService.create(
        createNotificationDto,
      );

      this.logger.log(`[DB] Notification saved (ID: ${savedNotification.id})`);

      // 2. Push real-time notification to user
      this.pushNotificationToUser(
        createNotificationDto.userId,
        savedNotification,
      );

      this.logger.log(`[WS] Pushed to user ${createNotificationDto.userId}`);

      return savedNotification;
    } catch (error) {
      this.logger.error(
        `[ERROR] Error creating notification: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Create notification in database for multiple users AND push real-time
   *
   * **When used:**
   * - Share post with followers
   * - Team assignment notifications
   * - Multi-user announcements with persistence
   *
   * @param userIds - Array of user IDs to notify
   * @param notificationData - Notification data (without userId)
   * @returns Array of created notifications
   */
  async createAndPushNotificationsToUsers(
    userIds: string[],
    notificationData: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<any[]> {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        this.logger.warn('[WARN] No user IDs provided for bulk notification');
        return [];
      }

      // 1. Create notifications for each user in database (parallel)
      const notificationPromises = userIds.map((userId) =>
        this.notificationService.create({
          ...notificationData,
          userId,
        }),
      );

      const notifications = await Promise.all(notificationPromises);

      this.logger.log(
        `[DB] Created ${notifications.length} notifications in parallel`,
      );

      // 2. Push real-time notifications to all users
      this.pushNotificationToUsers(userIds, notificationData);

      this.logger.log(`[WS] Pushed to ${userIds.length} users`);

      return notifications;
    } catch (error) {
      this.logger.error(
        `[ERROR] Error creating bulk notifications: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Create notification in database for all connected users AND broadcast
   *
   * **When used:**
   * - System maintenance announcement
   * - App-wide urgent alerts
   * - Feature releases
   * - Security warnings
   *
   * @param notificationData - Notification data (without userId)
   * @returns Array of created notifications (one per connected user)
   */
  async broadcastAndSaveNotification(
    notificationData: Omit<CreateNotificationDto, 'userId'>,
  ): Promise<any[]> {
    try {
      // Get all currently connected user IDs
      const userIds = Array.from(this.userConnections.keys());

      if (userIds.length === 0) {
        this.logger.warn('[WARN] No connected users to broadcast to');
        return [];
      }

      // 1. Create notifications for each connected user in database (parallel)
      const notificationPromises = userIds.map((userId) =>
        this.notificationService.create({
          ...notificationData,
          userId,
        }),
      );

      const notifications = await Promise.all(notificationPromises);

      this.logger.log(
        `[DB] Created ${notifications.length} broadcast notifications`,
      );

      // 2. Broadcast real-time notification to all
      this.broadcastNotification(notificationData);

      this.logger.log(
        `[WS] Broadcasted to all ${userIds.length} connected users`,
      );

      return notifications;
    } catch (error) {
      this.logger.error(
        `[ERROR] Error broadcasting notification: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  // ============================================
  // WEBSOCKET-ONLY PUSH METHODS (No DB Save)
  // Use these for transient, non-persistent events
  // ============================================

  /**
   * Push notification to a single user (WebSocket only, no database save)
   *
   * **When used:**
   * - User likes a post -> notify post creator
   * - User comments on post -> notify post creator
   * - User follows account -> notify followed user
   *
   * @param userId - The user ID to send notification to
   * @param notification - The notification payload
   */
  pushNotificationToUser(
    userId: string,
    notification: Record<string, unknown>,
  ): void {
    if (!userId || !this.server) {
      this.logger.warn(
        `[WARN] Cannot push notification: invalid userId (${userId}) or server not initialized`,
      );
      return;
    }

    this.logger.debug(`[WS] Pushing notification to user ${userId}`);

    // Emit to all sockets in the user's room
    this.server.to(`user_${userId}`).emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Push notification to multiple users
   *
   * **When used:**
   * - Admin announcement to multiple users
   * - Post shared with multiple followers
   *
   * @param userIds - Array of user IDs to send notification to
   * @param notification - The notification payload
   */
  pushNotificationToUsers(
    userIds: string[],
    notification: Record<string, unknown>,
  ): void {
    if (!Array.isArray(userIds) || !this.server) {
      this.logger.warn(
        `[WARN] Cannot push notifications: invalid userIds or server not initialized`,
      );
      return;
    }

    this.logger.debug(`[WS] Pushing notification to ${userIds.length} users`);

    userIds.forEach((userId) => {
      this.pushNotificationToUser(userId, notification);
    });
  }

  /**
   * Broadcast notification to all connected users
   *
   * **When used:**
   * - System announcements
   * - Maintenance alerts
   * - App-wide updates
   *
   * @param notification - The notification payload
   */
  broadcastNotification(notification: Record<string, unknown>): void {
    if (!this.server) {
      this.logger.warn(
        `[WARN] Cannot broadcast notification: server not initialized`,
      );
      return;
    }

    this.logger.log(
      `[WS] Broadcasting notification to all ${this.userConnections.size} connected users`,
    );

    this.server.emit('notification', {
      ...notification,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get the count of currently connected/subscribed users
   *
   * @returns Number of users with active connections
   */
  getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  /**
   * Get all socket IDs for a specific user
   * Useful for checking if a user has multiple connections
   *
   * @param userId - The user ID
   * @returns Array of socket IDs for that user
   */
  getUserConnections(userId: string): string[] {
    const connections = this.userConnections.get(userId);
    return connections ? Array.from(connections) : [];
  }

  /**
   * Check if a user is currently connected/subscribed
   *
   * @param userId - The user ID to check
   * @returns true if user has at least one active connection
   */
  isUserConnected(userId: string): boolean {
    const connections = this.userConnections.get(userId);
    return (connections?.size ?? 0) > 0;
  }

  // ============================================
  // UTILITY METHODS (Enhanced with Service)
  // ============================================

  /**
   * Get notification history for a user from database
   * Pushes history to user if they're connected
   *
   * @param userId - The user ID
   * @param limit - Max number of notifications (default 20)
   * @returns Object with data array and pagination metadata
   */
  async getUserNotificationHistory(
    userId: string,
    limit: number = 20,
  ): Promise<any> {
    try {
      const result = await this.notificationService.findAll(userId, {
        limit,
      });
      this.logger.log(
        `[DB] Retrieved ${result.data.length} notifications for user ${userId}`,
      );

      // Push history to user if connected
      if (this.isUserConnected(userId)) {
        this.pushNotificationToUser(userId, {
          type: 'NOTIFICATION_HISTORY',
          notifications: result.data,
          meta: result.meta,
        });
        this.logger.log(`[WS] Pushed history to user ${userId}`);
      }

      return result;
    } catch (error) {
      this.logger.error(
        `[ERROR] Error getting notification history: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Mark all user notifications as read in database
   * Emits confirmation to user if connected
   *
   * @param userId - The user ID
   * @returns Result object with count of updated notifications
   */
  async markUserNotificationsAsRead(userId: string): Promise<any> {
    try {
      const result = await this.notificationService.markAllAsRead(userId);
      this.logger.log(
        `[DB] Marked ${result.count} notifications as read for user ${userId}`,
      );

      // Emit confirmation to user
      if (this.isUserConnected(userId)) {
        this.pushNotificationToUser(userId, {
          type: 'NOTIFICATIONS_READ',
          message: 'All notifications marked as read',
          count: result.count,
        });
      }

      return result;
    } catch (error) {
      this.logger.error(
        `[ERROR] Error marking notifications as read: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Delete a specific notification from database
   * Emits confirmation to user if connected
   *
   * @param notificationId - The notification ID to delete
   * @param userId - The user ID (for permission check)
   * @returns Result object from delete operation
   */
  async deleteUserNotification(
    notificationId: string,
    userId: string,
  ): Promise<any> {
    try {
      const result = await this.notificationService.remove(
        notificationId,
        userId,
      );
      this.logger.log(
        `[DB] Deleted notification ${notificationId} for user ${userId}`,
      );

      // Emit confirmation to user
      if (this.isUserConnected(userId)) {
        this.pushNotificationToUser(userId, {
          type: 'NOTIFICATION_DELETED',
          notificationId,
          message: 'Notification deleted',
        });
      }

      return result;
    } catch (error) {
      this.logger.error(
        `[ERROR] Error deleting notification: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * Pushes count to user if connected
   *
   * @param userId - The user ID
   * @returns Object with unread count
   */
  async getUserUnreadCount(userId: string): Promise<any> {
    try {
      const result = await this.notificationService.getUnreadCount(userId);
      this.logger.log(
        `[DB] User ${userId} has ${result.count} unread notifications`,
      );

      // Emit count to user
      if (this.isUserConnected(userId)) {
        this.pushNotificationToUser(userId, {
          type: 'UNREAD_COUNT_UPDATE',
          unreadCount: result.count,
        });
      }

      return result;
    } catch (error) {
      this.logger.error(
        `[ERROR] Error getting unread count: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
