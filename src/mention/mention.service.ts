/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateMentionDto, UpdateMentionDto, GetMentionsDto } from './dto';

@Injectable()
export class MentionService {
  constructor(private readonly prisma: PrismaService) {}

  private getMentionInclude() {
    return {
      mentionedUser: {
        select: {
          id: true,
          fullName: true,
          username: true,
          avatarUrl: true,
          email: true,
        },
      },
      mentioner: {
        select: {
          id: true,
          fullName: true,
          username: true,
          avatarUrl: true,
          email: true,
        },
      },
      post: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      },
      pagePost: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          page: {
            select: {
              id: true,
              name: true,
            },
          },
          poster: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
        },
      },
      comment: {
        select: {
          id: true,
          commentText: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      },
    };
  }

  async create(userId: string, dto: CreateMentionDto) {
    // Validate that at least one of postId, pagePostId, or commentId is provided
    if (!dto.postId && !dto.pagePostId && !dto.commentId) {
      throw new BadRequestException(
        'Either postId, pagePostId, or commentId must be provided',
      );
    }

    // Verify mentioned user exists
    const mentionedUser = await this.prisma.client.user.findUnique({
      where: { id: dto.mentionedUserId },
    });

    if (!mentionedUser) {
      throw new NotFoundException('Mentioned user not found');
    }

    // Verify post exists if postId is provided
    if (dto.postId) {
      const post = await this.prisma.client.post.findUnique({
        where: { id: dto.postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }
    }

    // Verify page post exists if pagePostId is provided
    if (dto.pagePostId) {
      const pagePost = await this.prisma.client.pagePost.findUnique({
        where: { id: dto.pagePostId },
      });

      if (!pagePost) {
        throw new NotFoundException('Page post not found');
      }
    }

    // Verify comment exists if commentId is provided
    if (dto.commentId) {
      const comment = await this.prisma.client.comment.findUnique({
        where: { id: dto.commentId },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
    }

    const mention = await this.prisma.client.mention.create({
      data: {
        mentionedUserId: dto.mentionedUserId,
        mentionedBy: userId,
        postId: dto.postId,
        pagePostId: dto.pagePostId,
        commentId: dto.commentId,
      },
      include: this.getMentionInclude(),
    });

    return mention;
  }

  async findAll(dto: GetMentionsDto) {
    const {
      page = 1,
      limit = 10,
      mentionedUserId,
      mentionedBy,
      postId,
      pagePostId,
      commentId,
    } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (mentionedUserId) {
      where.mentionedUserId = mentionedUserId;
    }

    if (mentionedBy) {
      where.mentionedBy = mentionedBy;
    }

    if (postId) {
      where.postId = postId;
    }

    if (pagePostId) {
      where.pagePostId = pagePostId;
    }

    if (commentId) {
      where.commentId = commentId;
    }

    const [mentions, total] = await Promise.all([
      this.prisma.client.mention.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: this.getMentionInclude(),
      }),
      this.prisma.client.mention.count({ where }),
    ]);

    return {
      data: mentions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const mention = await this.prisma.client.mention.findUnique({
      where: { id },
      include: this.getMentionInclude(),
    });

    if (!mention) {
      throw new NotFoundException('Mention not found');
    }

    return mention;
  }

  async getUserMentions(userId: string) {
    const mentions = await this.prisma.client.mention.findMany({
      where: {
        mentionedUserId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: this.getMentionInclude(),
    });

    return mentions;
  }

  async update(id: string, userId: string, dto: UpdateMentionDto) {
    const mention = await this.prisma.client.mention.findUnique({
      where: { id },
    });

    if (!mention) {
      throw new NotFoundException('Mention not found');
    }

    // Only the user who created the mention can update it
    if (mention.mentionedBy !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this mention',
      );
    }

    // Verify mentioned user exists if being updated
    if (dto.mentionedUserId) {
      const mentionedUser = await this.prisma.client.user.findUnique({
        where: { id: dto.mentionedUserId },
      });

      if (!mentionedUser) {
        throw new NotFoundException('Mentioned user not found');
      }
    }

    // Verify post exists if being updated
    if (dto.postId) {
      const post = await this.prisma.client.post.findUnique({
        where: { id: dto.postId },
      });

      if (!post) {
        throw new NotFoundException('Post not found');
      }
    }

    // Verify page post exists if being updated
    if (dto.pagePostId) {
      const pagePost = await this.prisma.client.pagePost.findUnique({
        where: { id: dto.pagePostId },
      });

      if (!pagePost) {
        throw new NotFoundException('Page post not found');
      }
    }

    // Verify comment exists if being updated
    if (dto.commentId) {
      const comment = await this.prisma.client.comment.findUnique({
        where: { id: dto.commentId },
      });

      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
    }

    const updatedMention = await this.prisma.client.mention.update({
      where: { id },
      data: {
        mentionedUserId: dto.mentionedUserId,
        postId: dto.postId,
        pagePostId: dto.pagePostId,
        commentId: dto.commentId,
      },
      include: this.getMentionInclude(),
    });

    return updatedMention;
  }

  async remove(id: string, userId: string) {
    const mention = await this.prisma.client.mention.findUnique({
      where: { id },
    });

    if (!mention) {
      throw new NotFoundException('Mention not found');
    }

    // Only the user who created the mention can delete it
    if (mention.mentionedBy !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this mention',
      );
    }

    await this.prisma.client.mention.delete({
      where: { id },
    });

    return { message: 'Mention deleted successfully' };
  }
}
