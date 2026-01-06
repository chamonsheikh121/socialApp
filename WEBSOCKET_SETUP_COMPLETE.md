# WebSocket Notification Gateway Setup - Complete

## ✅ What's Been Configured

### 1. **Dependencies Installed**
- `@nestjs/websockets` - NestJS WebSocket support
- `@nestjs/platform-socket.io` - Socket.IO adapter for NestJS
- `socket.io` - WebSocket library

### 2. **Files Created**

#### [src/notification/notification.gateway.ts](src/notification/notification.gateway.ts)
Main WebSocket gateway with the following features:
- **Connection Management**: Track user connections and disconnect handling
- **Subscribe/Unsubscribe**: Users can subscribe/unsubscribe to their notifications
- **Push Methods**:
  - `pushNotificationToUser(userId, notification)` - Send to single user
  - `pushNotificationToUsers(userIds, notification)` - Send to multiple users
  - `broadcastNotification(notification)` - Send to all connected users
- **Utilities**:
  - `getConnectedUsersCount()` - Get total connected users
  - `getUserConnections(userId)` - Get socket IDs for a user

#### [src/notification/notification.types.ts](src/notification/notification.types.ts)
TypeScript interfaces and enums:
- `NotificationEventType` enum (LIKE, COMMENT, FOLLOW, MENTION, etc.)
- `NotificationPayload` interface - Standardized notification format
- `WebSocketNotificationEvent` interface

#### [src/notification/WEBSOCKET_USAGE_GUIDE.ts](src/notification/WEBSOCKET_USAGE_GUIDE.ts)
Complete usage guide with:
- Client-side setup examples
- Server-side integration examples
- Multiple usage scenarios
- Service injection examples

### 3. **Files Modified**

#### [src/main.ts](src/main.ts)
- Added `IoAdapter` import from `@nestjs/platform-socket.io`
- Configured WebSocket adapter: `app.useWebSocketAdapter(new IoAdapter(app))`

#### [src/notification/notification.module.ts](src/notification/notification.module.ts)
- Added `NotificationGateway` to providers
- Exported `NotificationGateway` for use in other modules

## 🚀 How to Use

### Inject Gateway in a Service
```typescript
import { Injectable } from '@nestjs/common';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class LikeService {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  async createLike(userId: string, actorId: string) {
    // ... save like to database ...

    // Push notification
    this.notificationGateway.pushNotificationToUser(userId, {
      type: NotificationEventType.LIKE,
      message: 'Someone liked your post',
      userId: userId,
      actorId: actorId,
      data: { postId: '123' }
    });
  }
}
```

### Client-Side Setup
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  socket.emit('subscribe', 'USER_ID');
});

socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // Update UI
});
```

## 📋 Gateway Methods Reference

| Method | Purpose | Example |
|--------|---------|---------|
| `pushNotificationToUser(userId, notification)` | Send to one user | `gateway.pushNotificationToUser('user-1', {...})` |
| `pushNotificationToUsers(userIds, notification)` | Send to multiple users | `gateway.pushNotificationToUsers(['user-1', 'user-2'], {...})` |
| `broadcastNotification(notification)` | Send to all online users | `gateway.broadcastNotification({...})` |
| `getConnectedUsersCount()` | Get total online users | `const count = gateway.getConnectedUsersCount()` |
| `getUserConnections(userId)` | Get socket IDs for user | `const sockets = gateway.getUserConnections('user-1')` |

## 🔧 WebSocket Events

### Client → Server Events
- **subscribe** - User subscribes to their notifications
  ```javascript
  socket.emit('subscribe', 'user-id')
  ```
- **unsubscribe** - User unsubscribes from notifications
  ```javascript
  socket.emit('unsubscribe', 'user-id')
  ```

### Server → Client Events
- **notification** - New notification from server
  ```javascript
  socket.on('notification', (notification) => {...})
  ```
- **subscribed** - Confirmation of successful subscription
  ```javascript
  socket.on('subscribed', (data) => {...})
  ```

## 📝 Next Steps

1. **Inject the gateway** in your service files:
   - `LikeService`
   - `CommentService`
   - `FollowService`
   - Any other service that creates user events

2. **Call push methods** after creating events:
   ```typescript
   this.notificationGateway.pushNotificationToUser(recipientId, notification);
   ```

3. **Test the connection** with your frontend application

4. **Monitor logs** for connection events:
   - Look for `Client connected: [socket-id]`
   - Look for `Client disconnected: [socket-id]`

## 🔒 CORS Configuration
Current CORS settings allow all origins. For production, update in `notification.gateway.ts`:
```typescript
@WebSocketGateway({
  cors: {
    origin: ['https://yourdomain.com'], // Specify your domain
    methods: ['GET', 'POST'],
  },
})
```

## 📊 Architecture Flow
```
User Action (Like, Comment, Follow)
    ↓
Service calls notificationGateway.pushNotificationToUser()
    ↓
WebSocket Gateway sends to Socket.IO room (user_${userId})
    ↓
Client receives via socket.on('notification')
    ↓
UI updates in real-time
```

The gateway is now ready to use! 🎉
