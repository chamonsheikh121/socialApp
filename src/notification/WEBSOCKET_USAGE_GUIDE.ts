/**
 * WEBSOCKET NOTIFICATION GATEWAY - USAGE GUIDE
 *
 * This file shows how to use the NotificationGateway to push real-time
 * notifications to users via WebSocket connections.
 */

// ============================================================================
// 1. BASIC SETUP - Already configured in:
//    - src/main.ts: IoAdapter setup for WebSocket support
//    - src/notification/notification.module.ts: Gateway provider
//    - src/notification/notification.gateway.ts: Main gateway implementation
// ============================================================================

// ============================================================================
// 2. CLIENT-SIDE SETUP (Frontend - e.g., React, Vue, Angular)
// ============================================================================

/*
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// Connect and subscribe to notifications
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Subscribe to your user notifications
  socket.emit('subscribe', 'YOUR_USER_ID');
});

// Listen for incoming notifications
socket.on('notification', (notification) => {
  console.log('Received notification:', notification);
  // Handle notification UI update here
});

// Handle subscription confirmation
socket.on('subscribed', (data) => {
  console.log('Subscribed to notifications:', data);
});

// Handle disconnection
socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
*/

// ============================================================================
// 3. SERVER-SIDE USAGE - How to inject and use the gateway
// ============================================================================

/*
import { Injectable } from '@nestjs/common';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationPayload, NotificationEventType } from '../notification/notification.types';

@Injectable()
export class LikeService {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  async createLike(userId: string, postId: string, actorId: string) {
    // ... Create like in database ...

    // Push notification to the post creator
    const notification: NotificationPayload = {
      type: NotificationEventType.LIKE,
      message: `Someone liked your post`,
      userId: userId, // Who receives the notification
      actorId: actorId, // Who performed the action
      actorName: 'John Doe',
      actorAvatar: 'https://...',
      data: {
        postId: postId,
        likeCount: 42
      }
    };

    // Send notification via WebSocket
    this.notificationGateway.pushNotificationToUser(userId, notification);
  }
}
*/

// ============================================================================
// 4. EXAMPLE SCENARIOS
// ============================================================================

// SCENARIO 1: Send notification to a single user
/*
this.notificationGateway.pushNotificationToUser(
  'user-123',
  {
    type: NotificationEventType.FOLLOW,
    message: 'Sarah started following you',
    userId: 'user-123',
    actorId: 'sarah-id',
    actorName: 'Sarah',
    data: { followingId: 'sarah-id' }
  }
);
*/

// SCENARIO 2: Send notification to multiple users
/*
this.notificationGateway.pushNotificationToUsers(
  ['user-123', 'user-456', 'user-789'],
  {
    type: NotificationEventType.POST_SHARED,
    message: 'A post you might like has been shared',
    userId: 'system', // System-wide notification
    data: { postId: 'post-123' }
  }
);
*/

// SCENARIO 3: Broadcast to all connected users
/*
this.notificationGateway.broadcastNotification({
  type: NotificationEventType.CUSTOM,
  message: 'System maintenance in 1 hour',
  userId: 'system',
  data: { maintenanceTime: '2026-01-07T10:00:00Z' }
});
*/

// ============================================================================
// 5. AVAILABLE GATEWAY METHODS
// ============================================================================

/*
// Push to single user
notificationGateway.pushNotificationToUser(userId: string, notification: any)

// Push to multiple users
notificationGateway.pushNotificationToUsers(userIds: string[], notification: any)

// Broadcast to all
notificationGateway.broadcastNotification(notification: any)

// Get count of connected users
notificationGateway.getConnectedUsersCount(): number

// Get socket IDs for a specific user
notificationGateway.getUserConnections(userId: string): string[]
*/

// ============================================================================
// 6. INTEGRATION EXAMPLE: In Comment Service
// ============================================================================

/*
import { Injectable } from '@nestjs/common';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationEventType } from '../notification/notification.types';

@Injectable()
export class CommentService {
  constructor(
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createComment(
    postOwnerId: string,
    commentAuthorId: string,
    postId: string,
    content: string
  ) {
    // Save comment to database
    // ... save logic ...

    // Send WebSocket notification to post owner
    this.notificationGateway.pushNotificationToUser(
      postOwnerId,
      {
        type: NotificationEventType.COMMENT,
        message: `Someone commented on your post: "${content}"`,
        userId: postOwnerId,
        actorId: commentAuthorId,
        data: {
          postId: postId,
          commentContent: content
        }
      }
    );
  }
}
*/

// ============================================================================
// 7. FULL INTEGRATION CHECKLIST
// ============================================================================

/*
✅ WebSocket dependencies installed (@nestjs/websockets, socket.io)
✅ IoAdapter configured in main.ts
✅ NotificationGateway created and added to NotificationModule
✅ Gateway exported from NotificationModule
✅ NotificationTypes defined for type safety
✅ Inject NotificationGateway in services that need to push notifications
✅ Update client to connect and listen for 'notification' events
✅ Handle both 'subscribe' and 'unsubscribe' events on client

Next Steps:
1. Inject NotificationGateway in your service files (e.g., LikeService, CommentService, FollowService)
2. Call pushNotificationToUser after creating relevant events
3. Test WebSocket connection with your frontend
4. Monitor gateway logs for connection/disconnection events
*/

export {};
