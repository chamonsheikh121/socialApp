/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { TypingIndicatorDto } from './dto/typing-indicator.dto';

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*', // Configure based on your needs
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  /**
   * Handle new WebSocket connection
   */
  handleConnection(client: Socket) {
    try {
      const token: any =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn('Client connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload: any = this.jwtService.verify(token);
      const userId: string = payload.sub;

      // Store socket connection
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)?.add(client.id);

      // Store user info in socket
      client.data.userId = userId;
      client.data.username = payload.username;

      // Join user to their personal room for direct messaging
      void client.join(`user:${userId}`);

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);

      // Notify user is online
      client.broadcast.emit('user:online', { userId });
    } catch (error) {
      this.logger.error('Connection authentication failed', error);
      client.disconnect();
    }
  }

  /**
   * Handle WebSocket disconnection
   */
  handleDisconnect(client: Socket) {
    const userId: any = client.data.userId;

    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);

        // If user has no more active connections, remove from map and notify offline
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          client.broadcast.emit('user:offline', { userId });
        }
      }
    }

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Send a message
   */
  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: SendMessageDto,
  ) {
    try {
      const userId: any = client.data.userId;

      // Save message to database
      const message = await this.chatService.sendMessage(userId, dto);

      // Get conversation to find all participants
      const conversation: any = await this.chatService.getConversation(
        userId,
        dto.conversationId,
      );

      // Emit to all participants in the conversation
      for (const participant of conversation.participants) {
        this.server.to(`user:${participant.userId}`).emit('message:new', {
          conversationId: dto.conversationId,
          message,
        });
      }

      // Send acknowledgment to sender
      return {
        status: 'success',
        message,
      };
    } catch (error) {
      this.logger.error('Error sending message', error);
      return {
        status: 'error',
        message: (error as Error).message,
      };
    }
  }

  /**
   * Mark message as read
   */
  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: MarkReadDto,
  ) {
    try {
      const userId: any = client.data.userId;

      await this.chatService.markMessageAsRead(userId, dto.messageId);

      return {
        status: 'success',
      };
    } catch (error) {
      this.logger.error('Error marking message as read', error);
      return {
        status: 'error',
        message: (error as Error).message,
      };
    }
  }

  /**
   * Typing indicator
   */
  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: TypingIndicatorDto,
  ) {
    try {
      const userId: any = client.data.userId;

      // Verify user is participant
      await this.chatService.getConversation(userId, dto.conversationId);

      // Broadcast typing indicator to other participants
      client.to(`conversation:${dto.conversationId}`).emit('typing:start', {
        conversationId: dto.conversationId,
        userId,
        username: client.data.username,
      });

      return { status: 'success' };
    } catch (error) {
      this.logger.error('Error in typing indicator', error);
      return {
        status: 'error',
        message: (error as Error).message,
      };
    }
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: TypingIndicatorDto,
  ) {
    try {
      const userId: any = client.data.userId;

      // Broadcast typing stop to other participants
      client.to(`conversation:${dto.conversationId}`).emit('typing:stop', {
        conversationId: dto.conversationId,
        userId,
      });

      return { status: 'success' };
    } catch (error) {
      return {
        status: 'error',
        message: (error as Error).message,
      };
    }
  }

  /**
   * Get online status of users
   */
  @SubscribeMessage('users:online-status')
  handleGetOnlineStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userIds: string[] },
  ) {
    const onlineUsers = data.userIds.filter((userId: string) =>
      this.userSockets.has(userId),
    );

    return {
      status: 'success',
      onlineUsers,
    };
  }

  /**
   * Helper method to emit event to specific user
   */
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Helper method to emit event to conversation
   */
  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }
}
