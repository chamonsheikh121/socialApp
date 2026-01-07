import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  CreateConversationDto,
  ConversationType,
} from './dto/create-conversation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

type AuthUser = { id: string };

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  /**
   * Create a new conversations
   */
  @Post('conversations')
  async createConversation(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(user.id, dto);
  }

  /**
   * Get all conversations for current user
   */
  @Get('conversations')
  async getConversations(@CurrentUser() user: AuthUser) {
    return this.chatService.getUserConversations(user.id);
  }

  /**
   * Get specific conversation details
   */
  @Get('conversations/:id')
  async getConversation(
    @CurrentUser() user: AuthUser,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.getConversation(user.id, conversationId);
  }

  /**
   * Get messages in a conversation
   */
  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentUser() user: AuthUser,
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : 50;
    return this.chatService.getMessages(
      user.id,
      conversationId,
      Number.isNaN(parsedLimit) ? 50 : parsedLimit,
      before,
    );
  }

  /**
   * Add participant to group conversation
   */
  @Post('conversations/:id/participants')
  async addParticipant(
    @CurrentUser() user: AuthUser,
    @Param('id') conversationId: string,
    @Body() body: { userId: string },
  ) {
    return this.chatService.addParticipant(
      user.id,
      conversationId,
      body.userId,
    );
  }

  /**
   * Leave conversation
   */
  @Post('conversations/:id/leave')
  async leaveConversation(
    @CurrentUser() user: AuthUser,
    @Param('id') conversationId: string,
  ) {
    return this.chatService.leaveConversation(user.id, conversationId);
  }

  /**
   * Find or create direct conversation with another user
   */
  @Post('conversations/direct/:userId')
  async getOrCreateDirectConversation(
    @CurrentUser() user: AuthUser,
    @Param('userId') otherUserId: string,
  ) {
    return this.chatService.createConversation(user.id, {
      type: ConversationType.DIRECT,
      participantIds: [otherUserId],
    });
  }
}
