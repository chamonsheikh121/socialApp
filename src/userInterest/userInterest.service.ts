import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { NotFoundError, BadRequestError } from '../common/error';
import { AddMultipleUserInterestsDto } from './dto/create-userInterest.dto';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class UserInterestService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(UserInterestService.name)
    private readonly logger: PinoLogger,
  ) {}

  async addInterest(userId: string, interestId: string) {
    this.logger.info({ userId, interestId }, 'Adding interest to user');

    // Check if user exists
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn({ userId }, 'User not found');
      throw new NotFoundError('User not found');
    }

    // Check if interest exists
    const interest = await this.prisma.client.interest.findUnique({
      where: { id: interestId },
    });

    if (!interest) {
      this.logger.warn({ interestId }, 'Interest not found');
      throw new NotFoundError('Interest not found');
    }

    // Check if user already has this interest
    const existing = await this.prisma.client.userInterest.findFirst({
      where: {
        userId,
        interestId,
      },
    });

    if (existing) {
      this.logger.warn(
        { userId, interestId },
        'User already has this interest',
      );
      throw new BadRequestError('User already has this interest');
    }

    const userInterest = await this.prisma.client.userInterest.create({
      data: {
        userId,
        interestId,
      },
      include: {
        interest: true,
      },
    });

    this.logger.info(
      { userId, interestId },
      'Interest added to user successfully',
    );

    return {
      message: 'Interest added successfully',
      userInterest,
    };
  }

  async addMultipleInterests(userId: string, dto: AddMultipleUserInterestsDto) {
    this.logger.info(
      { userId, interestIds: dto.interestIds },
      'Adding multiple interests to user',
    );

    // Check if user exists
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn({ userId }, 'User not found');
      throw new NotFoundError('User not found');
    }

    // Check which interests exist
    const interests = await this.prisma.client.interest.findMany({
      where: { id: { in: dto.interestIds } },
    });

    if (interests.length !== dto.interestIds.length) {
      throw new NotFoundError('One or more interests not found');
    }

    // Get existing user interests to avoid duplicates
    const existingUserInterests =
      await this.prisma.client.userInterest.findMany({
        where: {
          userId,
          interestId: { in: dto.interestIds },
        },
      });

    const existingInterestIds = existingUserInterests.map(
      (ui) => ui.interestId,
    );
    const newInterestIds = dto.interestIds.filter(
      (id) => !existingInterestIds.includes(id),
    );

    if (newInterestIds.length === 0) {
      throw new BadRequestError('All interests already added to user');
    }

    // Create user interests
    const userInterests = await this.prisma.client.$transaction(
      newInterestIds.map((interestId) =>
        this.prisma.client.userInterest.create({
          data: {
            userId,
            interestId,
          },
          include: {
            interest: true,
          },
        }),
      ),
    );

    this.logger.info(
      { userId, count: userInterests.length },
      'Multiple interests added successfully',
    );

    return {
      message: `${userInterests.length} interest(s) added successfully`,
      userInterests,
    };
  }

  async getUserInterests(userId: string) {
    this.logger.info({ userId }, 'Getting user interests');

    const userInterests = await this.prisma.client.userInterest.findMany({
      where: { userId },
      include: {
        interest: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      message: 'User interests retrieved successfully',
      count: userInterests.length,
      interests: userInterests.map((ui) => ui.interest),
    };
  }

  async removeInterest(userId: string, interestId: string) {
    this.logger.info({ userId, interestId }, 'Removing interest from user');

    const userInterest = await this.prisma.client.userInterest.findFirst({
      where: {
        userId,
        interestId,
      },
    });

    if (!userInterest) {
      this.logger.warn({ userId, interestId }, 'User interest not found');
      throw new NotFoundError('User does not have this interest');
    }

    await this.prisma.client.userInterest.delete({
      where: { id: userInterest.id },
    });

    this.logger.info(
      { userId, interestId },
      'Interest removed from user successfully',
    );

    return {
      message: 'Interest removed successfully',
    };
  }

  async removeAllInterests(userId: string) {
    this.logger.info({ userId }, 'Removing all interests from user');

    const result = await this.prisma.client.userInterest.deleteMany({
      where: { userId },
    });

    this.logger.info(
      { userId, count: result.count },
      'All interests removed from user',
    );

    return {
      message: `${result.count} interest(s) removed successfully`,
      count: result.count,
    };
  }
}
