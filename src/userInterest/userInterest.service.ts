/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { NotFoundError } from '../common/error';
import {
  CreateUserInterestDto,
  UpdateUserInterestDto,
} from './dto/create-userInterest.dto';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class UserInterestService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(UserInterestService.name)
    private readonly logger: PinoLogger,
  ) {}

  async create(userId: string, createUserInterestDto: CreateUserInterestDto) {
    this.logger.info(
      { userId, category: createUserInterestDto.category },
      'Creating user interest',
    );

    // Check if user exists
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn({ userId }, 'User not found for creating interest');
      throw new NotFoundError('User not found');
    }

    // Check if interest already exists for this user
    const existingInterest = await this.prisma.client.userInterest.findFirst({
      where: {
        userId,
        category: createUserInterestDto.category,
      },
    });

    if (existingInterest) {
      this.logger.warn(
        { userId, category: createUserInterestDto.category },
        'Interest already exists for user',
      );
      throw new Error('Interest already exists for this user');
    }

    const userInterest = await this.prisma.client.userInterest.create({
      data: {
        userId,
        category: createUserInterestDto.category,
      },
    });

    this.logger.info(
      { userId, interestId: userInterest.id },
      'User interest created successfully',
    );

    return {
      message: 'Interest added successfully',
      interest: userInterest,
    };
  }

  async findAll(userId: string) {
    this.logger.info({ userId }, 'Getting all user interests');

    const interests = await this.prisma.client.userInterest.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });

    return {
      message: 'Interests retrieved successfully',
      interests,
      count: interests.length,
    };
  }

  async findOne(userId: string, interestId: string) {
    this.logger.info({ userId, interestId }, 'Getting user interest by ID');

    const interest = await this.prisma.client.userInterest.findFirst({
      where: {
        id: interestId,
        userId,
      },
    });

    if (!interest) {
      this.logger.warn({ userId, interestId }, 'Interest not found');
      throw new NotFoundError('Interest not found');
    }

    return {
      message: 'Interest retrieved successfully',
      interest,
    };
  }

  async update(
    userId: string,
    interestId: string,
    updateUserInterestDto: UpdateUserInterestDto,
  ) {
    this.logger.info(
      { userId, interestId, category: updateUserInterestDto.category },
      'Updating user interest',
    );

    // Check if interest exists and belongs to user
    const existingInterest = await this.prisma.client.userInterest.findFirst({
      where: {
        id: interestId,
        userId,
      },
    });

    if (!existingInterest) {
      this.logger.warn({ userId, interestId }, 'Interest not found for update');
      throw new NotFoundError('Interest not found');
    }

    // Check if the new category already exists for this user (excluding current interest)
    if (updateUserInterestDto.category !== existingInterest.category) {
      const duplicateInterest = await this.prisma.client.userInterest.findFirst(
        {
          where: {
            userId,
            category: updateUserInterestDto.category,
          },
        },
      );

      if (duplicateInterest) {
        this.logger.warn(
          { userId, category: updateUserInterestDto.category },
          'Interest category already exists for user',
        );
        throw new Error('Interest category already exists for this user');
      }
    }

    const updatedInterest = await this.prisma.client.userInterest.update({
      where: { id: interestId },
      data: {
        category: updateUserInterestDto.category,
      },
    });

    this.logger.info(
      { userId, interestId },
      'User interest updated successfully',
    );

    return {
      message: 'Interest updated successfully',
      interest: updatedInterest,
    };
  }

  async remove(userId: string, interestId: string) {
    this.logger.info({ userId, interestId }, 'Removing user interest');

    // Check if interest exists and belongs to user
    const existingInterest = await this.prisma.client.userInterest.findFirst({
      where: {
        id: interestId,
        userId,
      },
    });

    if (!existingInterest) {
      this.logger.warn(
        { userId, interestId },
        'Interest not found for removal',
      );
      throw new NotFoundError('Interest not found');
    }

    await this.prisma.client.userInterest.delete({
      where: { id: interestId },
    });

    this.logger.info(
      { userId, interestId },
      'User interest removed successfully',
    );

    return {
      message: 'Interest removed successfully',
    };
  }

  async removeByCategory(userId: string, category: string) {
    this.logger.info(
      { userId, category },
      'Removing user interest by category',
    );

    const existingInterest = await this.prisma.client.userInterest.findFirst({
      where: {
        userId,
        category,
      },
    });

    if (!existingInterest) {
      this.logger.warn({ userId, category }, 'Interest not found for removal');
      throw new NotFoundError('Interest not found');
    }

    await this.prisma.client.userInterest.delete({
      where: { id: existingInterest.id },
    });

    this.logger.info(
      { userId, category },
      'User interest removed successfully',
    );

    return {
      message: 'Interest removed successfully',
    };
  }
}
