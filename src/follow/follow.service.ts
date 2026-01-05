/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { BadRequestError, NotFoundError } from '../common/error';
import { UserStatus } from 'generated/prisma/enums';

@Injectable()
export class FollowService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(FollowService.name) private readonly logger: PinoLogger,
  ) {}

  async followUser(followerId: string, followingId: string) {
    this.logger.info({ followerId, followingId }, 'Attempting to follow user');

    if (followerId === followingId) {
      this.logger.warn({ followerId }, 'User attempted to follow themselves');
      throw new BadRequestError('You cannot follow yourself');
    }

    const userToFollow = await this.prisma.client.user.findUnique({
      where: { id: followingId },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        isVerified: true,
        status: true,
        isBlocked: true,
        isDeleted: true, // ← added
      },
    });

    if (!userToFollow) {
      this.logger.warn({ followingId }, 'User to follow not found');
      throw new NotFoundError('User not found');
    }

    if (userToFollow.isDeleted) {
      this.logger.warn({ followingId }, 'User account is deleted');
      throw new BadRequestError(
        'You cannot follow this user because the account is deleted',
      );
    }

    if (userToFollow.status !== UserStatus.ACTIVE) {
      this.logger.warn(
        { followingId, status: userToFollow.status },
        'User account not active',
      );
      throw new BadRequestError(
        `Cannot follow this account (status: ${userToFollow.status})`,
      );
    }

    if (!userToFollow.isVerified) {
      this.logger.warn({ followingId }, 'User is not verified');
      throw new BadRequestError('You cannot follow an unverified account');
    }

    if (userToFollow.isBlocked) {
      this.logger.warn({ followingId }, 'User is blocked by admin');
      throw new BadRequestError(
        'You cannot follow this user because the account is blocked',
      );
    }

    const existingFollow = await this.prisma.client.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existingFollow) {
      this.logger.warn({ followerId, followingId }, 'Already following');
      throw new BadRequestError('You are already following this user');
    }

    const follow = await this.prisma.client.follow.create({
      data: { followerId, followingId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.logger.info({ followerId, followingId }, 'Followed user successfully');

    return {
      message: 'Successfully followed user',
      follow,
    };
  }

  async unfollowUser(followerId: string, followingId: string) {
    this.logger.info(
      { followerId, followingId },
      'Attempting to unfollow user',
    );

    // Check if follow relationship exists
    const existingFollow = await this.prisma.client.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      this.logger.warn(
        { followerId, followingId },
        'Follow relationship not found',
      );
      throw new NotFoundError('You are not following this user');
    }

    // Delete follow relationship
    await this.prisma.client.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    this.logger.info(
      { followerId, followingId },
      'Successfully unfollowed user',
    );

    return {
      message: 'Successfully unfollowed user',
    };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    this.logger.info({ userId, page, limit }, 'Fetching followers');

    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.client.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      }),
      this.prisma.client.follow.count({
        where: { followingId: userId },
      }),
    ]);

    this.logger.info({ userId, count: followers.length }, 'Fetched followers');

    return {
      data: followers.map((f) => ({
        ...f.follower,
        followedAt: f.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    this.logger.info({ userId, page, limit }, 'Fetching following');

    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.client.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      }),
      this.prisma.client.follow.count({
        where: { followerId: userId },
      }),
    ]);

    this.logger.info({ userId, count: following.length }, 'Fetched following');

    return {
      data: following.map((f) => ({
        ...f.following,
        followedAt: f.createdAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowStats(userId: string) {
    this.logger.info({ userId }, 'Fetching follow stats');

    const [followersCount, followingCount] = await Promise.all([
      this.prisma.client.follow.count({
        where: { followingId: userId },
      }),
      this.prisma.client.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      followers: followersCount,
      following: followingCount,
    };
  }
}
