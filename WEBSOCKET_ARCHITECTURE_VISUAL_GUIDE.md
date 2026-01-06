# 🎨 WebSocket Gateway - Visual Architecture & Examples

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Browser)                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  React/Vue/Angular App                                 │    │
│  │  ├─ socket.io-client                                   │    │
│  │  ├─ socket.emit('subscribe', userId)                   │    │
│  │  └─ socket.on('notification', (data) => { ... })       │    │
│  └────────┬────────────────────────────────────────────────┘    │
└───────────┼────────────────────────────────────────────────────┘
            │ WebSocket Connection (TCP)
            │ ws://localhost:5000
┌───────────▼────────────────────────────────────────────────────┐
│                     NESTJS BACKEND                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  NotificationGateway (@WebSocketGateway)               │    │
│  │  ┌─────────────────────────────────────────────────┐   │    │
│  │  │ userConnections Map<string, Set<string>>        │   │    │
│  │  │ user-123: [socket-abc, socket-def]              │   │    │
│  │  │ user-456: [socket-ghi]                          │   │    │
│  │  └─────────────────────────────────────────────────┘   │    │
│  │                                                         │    │
│  │ 🔄 Methods:                                            │    │
│  │  • handleConnection()                                  │    │
│  │  • handleDisconnect()                                  │    │
│  │  • handleSubscribe()      ← Client joins room          │    │
│  │  • handleUnsubscribe()    ← Client leaves room         │    │
│  │  • pushNotificationToUser()     ← Send 1 user         │    │
│  │  • pushNotificationToUsers()    ← Send many users      │    │
│  │  • broadcastNotification()      ← Send all            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Services (LikeService, CommentService, etc.)          │    │
│  │  → Inject NotificationGateway                           │    │
│  │  → Call push methods when events happen                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Socket.IO Server (room-based messaging)               │    │
│  │  Rooms: user_user-123, user_user-456, etc.             │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Event Flow

### **Scenario: User Likes a Post**

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEP 1: USER CLICKS LIKE                      │
│  Frontend: button.onClick(() => API.likePost(postId))            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│            STEP 2: LIKE SERVICE CREATES LIKE IN DB               │
│  Backend: async createLike(postId, userId, likerUserId)          │
│  → await prisma.like.create({ ... })                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│      STEP 3: SERVICE CALLS NOTIFICATION GATEWAY                  │
│  this.notificationGateway.pushNotificationToUser(postCreatorId, {
│    type: 'LIKE',                                                 │
│    message: 'Someone liked your post',                          │
│    actorId: likerUserId,                                        │
│    data: { postId }                                             │
│  })                                                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│        STEP 4: GATEWAY EMITS TO SOCKET.IO ROOM                  │
│  server.to('user_postCreatorId').emit('notification', {         │
│    type: 'LIKE',                                                │
│    message: 'Someone liked your post',                         │
│    actorId: likerUserId,                                       │
│    data: { postId },                                           │
│    timestamp: '2026-01-06T15:30:45.123Z'                      │
│  })                                                             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    Socket-ABC              Socket-DEF (different device)
    (same room)             (same room)
        │                             │
        └──────────────┬──────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│         STEP 5: FRONTEND RECEIVES NOTIFICATION                   │
│  socket.on('notification', (data) => {                          │
│    // data = { type, message, actorId, data, timestamp }        │
│    showNotificationToast(data.message);                         │
│    updateLikeCount(data.data.postId);                           │
│    playSound('notification.mp3');                               │
│  })                                                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│        STEP 6: USER SEES REAL-TIME NOTIFICATION ✨               │
│  ✅ Toast appears: "Someone liked your post"                    │
│  ✅ Like count updates: 42 → 43                                 │
│  ✅ Sound plays                                                  │
│  ✅ Notification badge updates                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Function Call Sequence

### **pushNotificationToUser(userId, notification)**

```
┌─────────────────────────────────────────────────────────────────┐
│  pushNotificationToUser('user-123', {                            │
│    type: 'LIKE',                                                │
│    message: 'John liked your post'                              │
│  })                                                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
                ┌──────────────┐
                │ Validate     │
                │ userId & server
                └────┬─────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
    ✅ Valid          ❌ Invalid
     │                 │
     │                 ▼
     │          ⚠️ Log warning
     │          Return early
     │
     ▼
┌──────────────────────────────────────┐
│ Log: 📤 Pushing notification to     │
│      user user-123                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ server.to('user_user-123')           │
│   .emit('notification', {             │
│     ...notification,                  │
│     timestamp: now()                  │
│   })                                  │
└────────┬─────────────────────────────┘
         │
         ▼
    Socket.IO sends to all sockets
    in room 'user_user-123'
    (across all devices/sessions)
```

---

## 📊 Connection Tracking Data Structure

```
userConnections: Map<string, Set<string>>

BEFORE:
┌─────────────────────────────────────┐
│ user-123 → [socket-abc, socket-def] │
│ user-456 → [socket-ghi]             │
│ user-789 → []                       │
└─────────────────────────────────────┘

AFTER User-789 Connects:
┌─────────────────────────────────────┐
│ user-123 → [socket-abc, socket-def] │
│ user-456 → [socket-ghi]             │
│ user-789 → [socket-jkl]             │  ✨ Added
└─────────────────────────────────────┘

AFTER User-789 Disconnects:
┌─────────────────────────────────────┐
│ user-123 → [socket-abc, socket-def] │
│ user-456 → [socket-ghi]             │
│ (user-789 deleted - no sockets)     │  🗑️ Cleaned
└─────────────────────────────────────┘
```

---

## 🔌 WebSocket Lifecycle

```
1. Page Loads
   ↓
   socket = io('http://localhost:5000')
   ↓
   handleConnection() triggered on server
   ↓
   ✅ Client connected: socket-abc

2. User Logs In
   ↓
   socket.emit('subscribe', 'user-123')
   ↓
   handleSubscribe() triggered
   ↓
   ✅ User user-123 subscribed with socket socket-abc
   ✅ Joins room: user_user-123
   ✅ Added to userConnections map

3. Notification Sent (While Connected)
   ↓
   server.to('user_user-123').emit('notification', {...})
   ↓
   socket.on('notification', (data) => { ... }) triggers
   ↓
   🔔 Frontend updates UI in real-time

4. User Logs Out
   ↓
   socket.emit('unsubscribe', 'user-123')
   OR
   socket.disconnect()
   ↓
   handleUnsubscribe() or handleDisconnect() triggered
   ↓
   ❌ Client disconnected: socket-abc
   ❌ User user-123 removed from connections
```

---

## 📱 Multi-Device Scenario

```
┌─────────────────────────────────────────────────────────────┐
│                    Same User, Different Devices               │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    Desktop          Tablet            Mobile
    Socket-ABC       Socket-DEF        Socket-GHI
        │                │                │
        └────────────────┼────────────────┘
                         │
                    All in Room:
              'user_user-123'
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
   When notification sent         All 3 devices
   to user-123:                  receive it simultaneously!
                                 
   pushNotificationToUser('user-123', {...})
         │
         ▼
   server.to('user_user-123').emit('notification')
         │
    ┌────┴────┬────────┐
    │          │        │
    ▼          ▼        ▼
  Socket-ABC  Socket-DEF  Socket-GHI
    │          │        │
    ▼          ▼        ▼
  Desktop   Tablet    Mobile
  (sees)    (sees)    (sees)

Result: User sees notification on ALL devices instantly ✨
```

---

## 🎨 Frontend React Implementation

```typescript
import io, { Socket } from 'socket.io-client';
import { useEffect, useState, useRef } from 'react';

export function useNotifications(userId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 1. Initialize Socket.IO
    socketRef.current = io('http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    // 2. Handle Connection
    socket.on('connect', () => {
      console.log('✅ Connected');
      setIsConnected(true);
      
      // 3. Subscribe to notifications
      socket.emit('subscribe', userId);
    });

    // 4. Handle Subscription Confirmation
    socket.on('subscribed', (data) => {
      console.log('✅ Subscribed:', data);
    });

    // 5. Listen for Notifications
    socket.on('notification', (notification) => {
      console.log('🔔 Got notification:', notification);
      
      // Add to list
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast
      toast.success(notification.message);
      
      // Handle specific types
      switch(notification.type) {
        case 'LIKE':
          updatePostUI(notification.data.postId);
          break;
        case 'COMMENT':
          updateCommentUI(notification.data.commentId);
          break;
        case 'FOLLOW':
          updateFollowerCount();
          break;
      }
    });

    // 6. Handle Errors
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      setIsConnected(false);
    });

    // 7. Handle Disconnection
    socket.on('disconnect', () => {
      console.log('❌ Disconnected');
      setIsConnected(false);
    });

    // 8. Cleanup on unmount
    return () => {
      socket.emit('unsubscribe', userId);
      socket.disconnect();
    };
  }, [userId]);

  return { 
    notifications, 
    isConnected,
    unreadCount: notifications.filter(n => !n.isRead).length
  };
}

// Usage in component
export function NotificationBell() {
  const { notifications, isConnected, unreadCount } = useNotifications(currentUserId);

  return (
    <div className="notification-bell">
      <Bell size={24} />
      {unreadCount > 0 && (
        <Badge className="badge">{unreadCount}</Badge>
      )}
      {!isConnected && (
        <span className="offline-indicator">Offline</span>
      )}
    </div>
  );
}
```

---

## 🧪 Testing the Gateway

### **Server-Side Test**
```bash
# Check logs while running
npm run start:dev

# Should see:
# ✅ Client connected: socket-xyz
# 📌 User user-123 subscribed...
# 📤 Pushing notification to user user-123
```

### **Frontend Console Test**
```javascript
// In browser console:
const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
  socket.emit('subscribe', 'test-user');
});

socket.on('subscribed', (data) => {
  console.log('✅ Subscribed:', data);
});

socket.on('notification', (notif) => {
  console.log('🔔 Notification:', notif);
});

// Later, from another service/api call:
// POST /api/likes
// → Triggers pushNotificationToUser
// → You'll see notification in console above
```

---

## ✅ Complete Integration Example

```typescript
// like.service.ts
@Injectable()
export class LikeService {
  constructor(
    private prisma: PrismaService,
    private notificationGateway: NotificationGateway,
  ) {}

  async createLike(postId: string, userId: string, likerUserId: string) {
    // 1. Save to database
    const like = await this.prisma.like.create({
      data: {
        postId,
        userId: likerUserId,
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true }
        }
      }
    });

    // 2. Get post to find owner
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) return like;

    // 3. Get updated like count
    const likeCount = await this.prisma.like.count({
      where: { postId }
    });

    // 4. Push real-time notification
    this.notificationGateway.pushNotificationToUser(post.userId, {
      type: 'LIKE',
      message: `${like.user.username} liked your post`,
      userId: post.userId,        // Who receives
      actorId: likerUserId,        // Who did it
      actorName: like.user.username,
      actorAvatar: like.user.avatarUrl,
      data: {
        postId,
        likeId: like.id,
        likeCount,                 // Updated count
      }
    });

    return like;
  }
}
```

---

## 📈 Performance Considerations

```
Max Connected Users:
┌────────────────────────┐
│ Depends on:            │
│ • Server resources     │
│ • Memory available     │
│ • Network bandwidth    │
│ • OS limits            │
└────────────────────────┘
Typical: 10,000+ concurrent

Message Throughput:
┌────────────────────────┐
│ • Single user: < 1ms   │
│ • 100 users: < 2ms     │
│ • 10K users: ~5-10ms   │
└────────────────────────┘

Optimization Tips:
✓ Use rooms for targeting (don't broadcast to all)
✓ Compress large notification payloads
✓ Implement rate limiting
✓ Use binary protocol for high-frequency events
✓ Monitor connection metrics
```

This completes the full visual architecture and implementation guide! 🎉
