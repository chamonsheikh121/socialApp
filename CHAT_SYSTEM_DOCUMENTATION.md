# Real-Time Chat System Documentation

## 🎯 Overview

The chat system supports:
- **One-to-One** direct messaging
- **Group Chat** with multiple participants
- **Real-time** message delivery via WebSockets
- **Message persistence** to database
- **Read receipts** tracking
- **Typing indicators**
- **Online/Offline status**

---

## 📊 Database Schema

### Conversation Model
```prisma
model Conversation {
  id           String               @id @default(uuid())
  type         ConversationType     @default(DIRECT)
  name         String?              // Group name
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt
  
  participants ConversationParticipant[]
  messages     Message[]
}
```

### ConversationParticipant Model
```prisma
model ConversationParticipant {
  id             String       @id @default(uuid())
  conversationId String
  userId         String
  joinedAt       DateTime     @default(now())
  leftAt         DateTime?
  lastReadAt     DateTime?
  
  conversation   Conversation @relation(...)
  user           User         @relation(...)
}
```

### Message Model
```prisma
model Message {
  id               String        @id @default(uuid())
  content          String?
  senderId         String
  conversationId   String
  replyToMessageId String?
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  
  sender           User          @relation(...)
  conversation     Conversation  @relation(...)
  replyToMessage   Message?      @relation(...)
  replies          Message[]     @relation(...)
  media            Media[]
  readReceipts     MessageRead[]
}
```

### MessageRead Model
```prisma
model MessageRead {
  id        String   @id @default(uuid())
  messageId String
  userId    String
  readAt    DateTime @default(now())
  
  message   Message  @relation(...)
  user      User     @relation(...)
}
```

---

## 🔌 WebSocket Events

### Connection
**Namespace:** `/chat`

**Authentication:** Pass JWT token in handshake
```javascript
const socket = io('http://localhost:3000/chat', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Client → Server Events

#### 1. Join Conversation
```javascript
socket.emit('conversation:join', {
  conversationId: 'uuid'
});
```

#### 2. Leave Conversation
```javascript
socket.emit('conversation:leave', {
  conversationId: 'uuid'
});
```

#### 3. Send Message
```javascript
socket.emit('message:send', {
  conversationId: 'uuid',
  content: 'Hello!',
  replyToMessageId: 'uuid' // optional
});
```

#### 4. Mark Message as Read
```javascript
socket.emit('message:read', {
  messageId: 'uuid'
});
```

#### 5. Typing Indicators
```javascript
// Start typing
socket.emit('typing:start', {
  conversationId: 'uuid',
  isTyping: true
});

// Stop typing
socket.emit('typing:stop', {
  conversationId: 'uuid',
  isTyping: false
});
```

#### 6. Check Online Status
```javascript
socket.emit('users:online-status', {
  userIds: ['uuid1', 'uuid2', 'uuid3']
});
```

### Server → Client Events

#### 1. New Message
```javascript
socket.on('message:new', (data) => {
  // data: { conversationId, message }
  console.log('New message:', data.message);
});
```

#### 2. Message Read
```javascript
socket.on('message:read', (data) => {
  // data: { messageId, userId, conversationId }
  console.log('Message read by:', data.userId);
});
```

#### 3. Typing Start
```javascript
socket.on('typing:start', (data) => {
  // data: { conversationId, userId, username }
  console.log(`${data.username} is typing...`);
});
```

#### 4. Typing Stop
```javascript
socket.on('typing:stop', (data) => {
  // data: { conversationId, userId }
  console.log('User stopped typing');
});
```

#### 5. User Online
```javascript
socket.on('user:online', (data) => {
  // data: { userId }
  console.log('User came online:', data.userId);
});
```

#### 6. User Offline
```javascript
socket.on('user:offline', (data) => {
  // data: { userId }
  console.log('User went offline:', data.userId);
});
```

---

## 🌐 REST API Endpoints

### 1. Create Conversation
**POST** `/chat/conversations`

**Body:**
```json
{
  "type": "DIRECT" | "GROUP",
  "name": "Group Name", // required for GROUP
  "participantIds": ["userId1", "userId2"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "type": "DIRECT",
  "name": null,
  "createdAt": "2026-01-07T...",
  "participants": [
    {
      "id": "uuid",
      "userId": "uuid",
      "user": {
        "id": "uuid",
        "username": "john",
        "fullName": "John Doe",
        "avatarUrl": "..."
      }
    }
  ]
}
```

### 2. Get User Conversations
**GET** `/chat/conversations`

**Response:**
```json
[
  {
    "id": "uuid",
    "type": "DIRECT",
    "name": null,
    "updatedAt": "2026-01-07T...",
    "participants": [...],
    "messages": [
      {
        "id": "uuid",
        "content": "Last message",
        "createdAt": "2026-01-07T...",
        "sender": {...}
      }
    ]
  }
]
```

### 3. Get Conversation Details
**GET** `/chat/conversations/:id`

**Response:**
```json
{
  "id": "uuid",
  "type": "GROUP",
  "name": "Team Chat",
  "participants": [...]
}
```

### 4. Get Messages
**GET** `/chat/conversations/:id/messages?limit=50&before=2026-01-07T...`

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)
- `before` (optional): ISO timestamp for pagination

**Response:**
```json
[
  {
    "id": "uuid",
    "content": "Hello!",
    "senderId": "uuid",
    "conversationId": "uuid",
    "createdAt": "2026-01-07T...",
    "sender": {
      "id": "uuid",
      "username": "john",
      "fullName": "John Doe",
      "avatarUrl": "..."
    },
    "replyToMessage": null,
    "readReceipts": [
      {
        "userId": "uuid",
        "readAt": "2026-01-07T...",
        "user": {...}
      }
    ]
  }
]
```

### 5. Find/Create Direct Conversation
**POST** `/chat/conversations/direct/:userId`

Creates a direct conversation with the specified user, or returns existing one.

**Response:** Same as Create Conversation

### 6. Add Participant (Group Only)
**POST** `/chat/conversations/:id/participants`

**Body:**
```json
{
  "userId": "uuid"
}
```

### 7. Leave Conversation
**POST** `/chat/conversations/:id/leave`

---

## 💡 Usage Examples

### Frontend Implementation (React + Socket.io)

```javascript
import { io } from 'socket.io-client';
import { useState, useEffect } from 'react';

function ChatApp() {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(new Set());

  useEffect(() => {
    // Connect to chat
    const newSocket = io('http://localhost:3000/chat', {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat');
    });

    // Listen for new messages
    newSocket.on('message:new', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    // Listen for typing
    newSocket.on('typing:start', (data) => {
      setTyping(prev => new Set(prev).add(data.userId));
    });

    newSocket.on('typing:stop', (data) => {
      setTyping(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const sendMessage = (conversationId, content) => {
    socket.emit('message:send', {
      conversationId,
      content
    });
  };

  const startTyping = (conversationId) => {
    socket.emit('typing:start', { conversationId, isTyping: true });
  };

  const stopTyping = (conversationId) => {
    socket.emit('typing:stop', { conversationId, isTyping: false });
  };

  return (
    <div>
      {/* Your chat UI */}
    </div>
  );
}
```

### Creating a Direct Chat

```javascript
// Step 1: Create or get conversation
const response = await fetch('/chat/conversations/direct/userId123', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const conversation = await response.json();

// Step 2: Join conversation room via WebSocket
socket.emit('conversation:join', {
  conversationId: conversation.id
});

// Step 3: Load messages
const messagesResponse = await fetch(
  `/chat/conversations/${conversation.id}/messages`,
  {
    headers: { 'Authorization': `Bearer ${token}` }
  }
);

const messages = await messagesResponse.json();
```

### Creating a Group Chat

```javascript
const response = await fetch('/chat/conversations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'GROUP',
    name: 'Project Team',
    participantIds: ['user1', 'user2', 'user3']
  })
});

const groupChat = await response.json();
```

---

## 🚀 Next Steps

1. **Start your database:**
   ```bash
   docker-compose up -d
   ```

2. **Run the migration:**
   ```bash
   npx prisma migrate dev --name add_conversation_and_group_chat_support
   ```

3. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Start your server:**
   ```bash
   npm run start:dev
   ```

5. **Test WebSocket connection:**
   - Connect to `ws://localhost:3000/chat`
   - Pass JWT token in auth handshake

---

## 🔒 Security Features

- ✅ JWT authentication required for WebSocket connections
- ✅ Participants verification before sending messages
- ✅ Users can only access their own conversations
- ✅ Read receipts only for conversation participants
- ✅ Automatic disconnection on invalid tokens

---

## 📈 Performance Optimizations

- Message pagination with cursor-based loading
- Indexed database queries for fast lookups
- Efficient socket room management
- User socket mapping for O(1) lookups
- Automatic conversation updatedAt tracking

---

## 🐛 Troubleshooting

### WebSocket Connection Failed
- Verify JWT token is valid
- Check CORS configuration in gateway
- Ensure server is running on correct port

### Messages Not Saving
- Check database connection
- Verify user is a participant in conversation
- Check Prisma schema is migrated

### Read Receipts Not Working
- Ensure user joined conversation room
- Verify message exists
- Check user is not marking their own messages

---

## 📝 Notes

- Direct conversations are automatically detected and reused
- Users must join conversation room to receive real-time updates
- Typing indicators auto-clear on disconnect
- Online status based on active WebSocket connections
- Messages support media attachments via existing Media model
