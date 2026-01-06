/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreatePageFollowerDto, GetPageFollowersDto } from './dto';

@Injectable()
export class PageFollowerService {
  constructor(private readonly prisma: PrismaService) {}

  private getFollowerInclude() {
    return {
      page: {
        select: {
          id: true,
          name: true,
          username: true,
          avatarUrl: true,
          description: true,
        },
      },
      user: {
        select: {
          id: true,
          fullName: true,
          username: true,
          avatarUrl: true,
          bio: true,
        },
      },
    };
  }

  async create(userId: string, dto: CreatePageFollowerDto) {
    // Verify page exists
    const page = await this.prisma.client.page.findUnique({
      where: { id: dto.pageId },
    });

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Check if already following
    const existingFollower = await this.prisma.client.pageFollower.findUnique({
      where: {
        pageId_userId: {
          pageId: dto.pageId,
          userId: userId,
        },
      },
    });

    if (existingFollower) {
      throw new ConflictException('You are already following this page');
    }

    const follower = await this.prisma.client.pageFollower.create({
      data: {
        pageId: dto.pageId,
        userId: userId,
      },
      include: this.getFollowerInclude(),
    });

    return follower;
  }

  async findAll(dto: GetPageFollowersDto) {
    const { page = 1, limit = 10, pageId, userId } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (pageId) {
      where.pageId = pageId;
    }

    if (userId) {
      where.userId = userId;
    }

    const [followers, total] = await Promise.all([
      this.prisma.client.pageFollower.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          followedAt: 'desc',
        },
        include: this.getFollowerInclude(),
      }),
      this.prisma.client.pageFollower.count({ where }),
    ]);

    return {
      data: followers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const follower = await this.prisma.client.pageFollower.findUnique({
      where: { id },
      include: this.getFollowerInclude(),
    });

    if (!follower) {
      throw new NotFoundException('Follower record not found');
    }

    return follower;
  }

  async getPageFollowers(pageId: string, page = 1, limit = 10) {
    // Verify page exists
    const pageExists = await this.prisma.client.page.findUnique({
      where: { id: pageId },
    });

    if (!pageExists) {
      throw new NotFoundException('Page not found');
    }

    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.client.pageFollower.findMany({
        where: { pageId },
        skip,
        take: limit,
        orderBy: {
          followedAt: 'desc',
        },
        include: this.getFollowerInclude(),
      }),
      this.prisma.client.pageFollower.count({ where: { pageId } }),
    ]);

    return {
      data: followers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserFollowedPages(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [followedPages, total] = await Promise.all([
      this.prisma.client.pageFollower.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: {
          followedAt: 'desc',
        },
        include: this.getFollowerInclude(),
      }),
      this.prisma.client.pageFollower.count({ where: { userId } }),
    ]);

    return {
      data: followedPages,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async isFollowing(userId: string, pageId: string) {
    const follower = await this.prisma.client.pageFollower.findUnique({
      where: {
        pageId_userId: {
          pageId,
          userId,
        },
      },
    });

    return { isFollowing: !!follower };
  }

  async remove(id: string, userId: string) {
    const follower = await this.prisma.client.pageFollower.findUnique({
      where: { id },
      include: {
        page: {
          include: {
            pageAdmins: true,
          },
        },
      },
    });

    if (!follower) {
      throw new NotFoundException('Follower record not found');
    }

    // Only the follower themselves or page owner/admin can remove
    const isFollower = follower.userId === userId;
    const isOwner = follower.page.ownerId === userId;
    const isAdmin = follower.page.pageAdmins.some(
      (admin) => admin.userId === userId,
    );

    if (!isFollower && !isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You are not allowed to remove this follower',
      );
    }

    await this.prisma.client.pageFollower.delete({
      where: { id },
    });

    return { message: 'Unfollowed successfully' };
  }

  async unfollowPage(userId: string, pageId: string) {
    const follower = await this.prisma.client.pageFollower.findUnique({
      where: {
        pageId_userId: {
          pageId,
          userId,
        },
      },
    });

    if (!follower) {
      throw new NotFoundException('You are not following this page');
    }

    await this.prisma.client.pageFollower.delete({
      where: {
        pageId_userId: {
          pageId,
          userId,
        },
      },
    });

    return { message: 'Unfollowed successfully' };
  }
}
