/**
 * Note: TypeScript errors in this file are expected until Prisma migration is run.
 * The Conversation, ConversationParticipant, and MessageRead models will be available
 * after running: npx prisma migrate dev --name add_conversation_and_group_chat_support
 */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  CreateConversationDto,
  ConversationType as ConversationTypeDto,
} from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  Prisma,
  ConversationType as PrismaConversationType,
} from '../../prisma/generated/prisma/client';

type ConversationWithParticipants = Prisma.ConversationGetPayload<{
  include: {
    participants: {
      include: {
        user: {
          select: {
            id: true;
            username: true;
            fullName: true;
            avatarUrl: true;
          };
        };
      };
    };
  };
}>;

type ConversationWithParticipantsAndLastMessage =
  Prisma.ConversationGetPayload<{
    include: {
      participants: {
        where: { leftAt: null };
        include: {
          user: {
            select: {
              id: true;
              username: true;
              fullName: true;
              avatarUrl: true;
            };
          };
        };
      };
      messages: {
        take: 1;
        orderBy: { createdAt: 'desc' };
        include: {
          sender: {
            select: {
              id: true;
              username: true;
              fullName: true;
            };
          };
        };
      };
    };
  }>;

type MessageWithRelations = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        id: true;
        username: true;
        fullName: true;
        avatarUrl: true;
      };
    };
    replyToMessage: {
      include: {
        sender: {
          select: {
            id: true;
            username: true;
            fullName: true;
          };
        };
      };
    };
  };
}>;

type MessageWithConversationParticipants = Prisma.MessageGetPayload<{
  include: {
    conversation: {
      include: {
        participants: true;
      };
    };
  };
}>;

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new conversation (direct or group)
   */
  async createConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationWithParticipants> {
    // For direct conversations, ensure only 2 participants
    if (dto.type === ConversationTypeDto.DIRECT) {
      if (dto.participantIds.length !== 1) {
        throw new BadRequestException(
          'Direct conversation must have exactly 1 other participant',
        );
      }

      // Check if direct conversation already exists
      const existingConversation = await this.findDirectConversation(
        userId,
        dto.participantIds[0],
      );
      if (existingConversation) {
        return existingConversation;
      }
    }

    // For group conversations, ensure we have a name
    if (dto.type === ConversationTypeDto.GROUP && !dto.name) {
      throw new BadRequestException('Group conversation must have a name');
    }

    // Create conversation with participants
    const conversation = await this.prisma.client.conversation.create({
      data: {
        type:
          dto.type === ConversationTypeDto.DIRECT
            ? PrismaConversationType.DIRECT
            : PrismaConversationType.GROUP,
        name: dto.name,
        participants: {
          create: [
            { userId }, // Creator
            ...dto.participantIds.map((id) => ({ userId: id })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return conversation;
  }

  /**
   * Find existing direct conversation between two users
   */
  async findDirectConversation(
    user1Id: string,
    user2Id: string,
  ): Promise<ConversationWithParticipants | undefined> {
    const conversations = await this.prisma.client.conversation.findMany({
      where: {
        type: 'DIRECT',
        participants: {
          every: {
            userId: {
              in: [user1Id, user2Id],
            },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Find the conversation with exactly these 2 users
    return conversations.find(
      (conv) =>
        conv.participants.length === 2 &&
        conv.participants.every(
          (p) => p.userId === user1Id || p.userId === user2Id,
        ),
    );
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(
    userId: string,
  ): Promise<ConversationWithParticipantsAndLastMessage[]> {
    const conversations = await this.prisma.client.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
            leftAt: null, // Only active participants
          },
        },
      },
      include: {
        participants: {
          where: {
            leftAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return conversations;
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(
    userId: string,
    dto: SendMessageDto,
  ): Promise<MessageWithRelations> {
    // Verify user is participant in the conversation
    const participant =
      await this.prisma.client.conversationParticipant.findFirst({
        where: {
          conversationId: dto.conversationId,
          userId,
          leftAt: null,
        },
      });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Create the message
    const message = await this.prisma.client.message.create({
      data: {
        content: dto.content,
        senderId: userId,
        conversationId: dto.conversationId,
        replyToMessageId: dto.replyToMessageId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        replyToMessage: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    // Update conversation's updatedAt timestamp
    await this.prisma.client.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /**
   * Get messages in a conversation
   */
  async getMessages(
    userId: string,
    conversationId: string,
    limit = 50,
    before?: string,
  ): Promise<MessageWithRelations[]> {
    // Verify user is participant
    const participant =
      await this.prisma.client.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
          leftAt: null,
        },
      });

    if (!participant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    const messages = await this.prisma.client.message.findMany({
      where: {
        conversationId,
        ...(before && {
          createdAt: {
            lt: new Date(before),
          },
        }),
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        replyToMessage: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    return messages.reverse(); // Return in chronological order
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(userId: string, messageId: string) {
    const message = await this.prisma.client.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: {
            participants: {
              where: {
                userId,
                leftAt: null,
              },
            },
          },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const participantCount = (message as MessageWithConversationParticipants)
      .conversation.participants.length;

    if (participantCount === 0) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    // Don't mark own messages as read
    if (message.senderId === userId) {
      return;
    }

    // Create or update read receipt
    await this.prisma.client.messageRead.upsert({
      where: {
        messageId_userId: {
          messageId,
          userId,
        },
      },
      create: {
        messageId,
        userId,
      },
      update: {
        readAt: new Date(),
      },
    });
  }

  /**
   * Get conversation details
   */
  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.client.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          where: {
            leftAt: null,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Verify user is participant
    const isParticipant = conversation.participants.some(
      (p) => p.userId === userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    return conversation;
  }

  /**
   * Add participant to group conversation
   */
  async addParticipant(
    userId: string,
    conversationId: string,
    newParticipantId: string,
  ) {
    const conversation = await this.getConversation(userId, conversationId);

    if (conversation.type !== PrismaConversationType.GROUP) {
      throw new BadRequestException(
        'Can only add participants to group conversations',
      );
    }

    await this.prisma.client.conversationParticipant.create({
      data: {
        conversationId,
        userId: newParticipantId,
      },
    });
  }

  /**
   * Leave conversation
   */
  async leaveConversation(userId: string, conversationId: string) {
    await this.prisma.client.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
      data: {
        leftAt: new Date(),
      },
    });
  }
}
