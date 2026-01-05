/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ToggleLikeDto, GetLikesDto } from './dto';

@Injectable()
export class LikeService {
  constructor(private readonly prisma: PrismaService) {}

  async toggleLike(userId: string, dto: ToggleLikeDto) {
    // Verify post exists
    const post = await this.prisma.client.post.findUnique({
      where: { id: dto.postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already liked this post
    const existingLike = await this.prisma.client.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId: dto.postId,
        },
      },
    });

    if (existingLike) {
      // Unlike: Remove the like
      await this.prisma.client.like.delete({
        where: { id: existingLike.id },
      });

      return {
        message: 'Post unliked successfully',
        liked: false,
      };
    } else {
      // Like: Create new like
      await this.prisma.client.like.create({
        data: {
          userId,
          postId: dto.postId,
        },
      });

      return {
        message: 'Post liked successfully',
        liked: true,
      };
    }
  }

  async getLikes(dto: GetLikesDto) {
    const { page = 1, limit = 10, postId } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (postId) {
      where.postId = postId;
    }

    const [likes, total] = await Promise.all([
      this.prisma.client.like.findMany({
        where,
        skip,
        take: limit,
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
          post: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      }),
      this.prisma.client.like.count({ where }),
    ]);

    return {
      data: likes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async checkUserLiked(userId: string, postId: string) {
    const like = await this.prisma.client.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return {
      liked: !!like,
    };
  }

  async getUserLikes(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.client.like.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          post: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  username: true,
                  avatarUrl: true,
                },
              },
              media: true,
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.client.like.count({ where: { userId } }),
    ]);

    return {
      data: likes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
