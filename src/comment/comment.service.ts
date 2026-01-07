import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto } from './dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCommentDto) {
    // Verify post exists
    const post = await this.prisma.client.post.findUnique({
      where: { id: dto.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If replying to a comment, verify parent comment exists
    if (dto.parentCommentId) {
      const parentComment = await this.prisma.client.comment.findUnique({
        where: { id: dto.parentCommentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      // Verify parent comment belongs to the same post
      if (parentComment.postId !== dto.postId) {
        throw new BadRequestException(
          'Parent comment does not belong to this post',
        );
      }
    }

    const comment = await this.prisma.client.comment.create({
      data: {
        userId,
        postId: dto.postId,
        commentText: dto.commentText,
        parentCommentId: dto.parentCommentId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            childComments: true,
          },
        },
      },
    });

    return comment;
  }

  async findAllByPost(postId: string) {
    // Verify post exists
    const post = await this.prisma.client.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Get only top-level comments (not replies)
    const comments = await this.prisma.client.comment.findMany({
      where: {
        postId,
        parentCommentId: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        childComments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                childComments: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            childComments: true,
          },
        },
      },
    });

    return comments;
  }

  async findOne(id: string) {
    const comment = await this.prisma.client.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        childComments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                childComments: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            childComments: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(id: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.client.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this comment',
      );
    }

    const updatedComment = await this.prisma.client.comment.update({
      where: { id },
      data: {
        commentText: dto.commentText,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            childComments: true,
          },
        },
      },
    });

    return updatedComment;
  }

  async remove(id: string, userId: string) {
    const comment = await this.prisma.client.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this comment',
      );
    }

    await this.prisma.client.comment.delete({
      where: { id },
    });

    return { message: 'Comment deleted successfully' };
  }
}
