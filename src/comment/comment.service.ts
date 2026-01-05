/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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

  //   async findAll(dto: GetCommentsDto) {
  //     const { page = 1, limit = 10, postId, parentCommentId } = dto;
  //     const skip = (page - 1) * limit;

  //     const where: any = {};

  //     if (postId) {
  //       where.postId = postId;
  //     }

  //     if (parentCommentId !== undefined) {
  //       where.parentCommentId = parentCommentId;
  //     } else {
  //       // By default, only get top-level comments (not replies)
  //       where.parentCommentId = null;
  //     }

  //     const [comments, total] = await Promise.all([
  //       this.prisma.client.comment.findMany({
  //         where,
  //         skip,
  //         take: limit,
  //         orderBy: {
  //           createdAt: 'desc',
  //         },
  //         include: {
  //           user: {
  //             select: {
  //               id: true,
  //               fullName: true,
  //               username: true,
  //               avatarUrl: true,
  //             },
  //           },
  //           _count: {
  //             select: {
  //               childComments: true,
  //             },
  //           },
  //         },
  //       }),
  //       this.prisma.client.comment.count({ where }),
  //     ]);

  //     return {
  //       data: comments,
  //       meta: {
  //         total,
  //         page,
  //         limit,
  //         totalPages: Math.ceil(total / limit),
  //       },
  //     };
  //   }

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
