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
      { userId, interests: createUserInterestDto.interest },
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

    // Check if user already has interests
    const existingInterest = await this.prisma.client.userInterest.findUnique({
      where: { userId },
    });

    if (existingInterest) {
      this.logger.warn({ userId }, 'User interest already exists');
      throw new Error('User interest already exists. Use update instead.');
    }

    const userInterest = await this.prisma.client.userInterest.create({
      data: {
        userId,
        photoURL: createUserInterestDto.photoURL,
        interest: createUserInterestDto.interest,
      },
    });

    this.logger.info(
      { userId, interestId: userInterest.id },
      'User interest created successfully',
    );

    return {
      message: 'Interests added successfully',
      interest: userInterest,
    };
  }

  async findAll(userId: string) {
    this.logger.info({ userId }, 'Getting user interests');

    const userInterest = await this.prisma.client.userInterest.findUnique({
      where: { userId },
    });

    if (!userInterest) {
      return {
        message: 'No interests found for user',
        interest: null,
      };
    }

    return {
      message: 'Interests retrieved successfully',
      interest: userInterest,
    };
  }

  async findOne(userId: string) {
    this.logger.info({ userId }, 'Getting user interest');

    const userInterest = await this.prisma.client.userInterest.findUnique({
      where: { userId },
    });

    if (!userInterest) {
      this.logger.warn({ userId }, 'User interest not found');
      throw new NotFoundError('User interest not found');
    }

    return {
      message: 'Interest retrieved successfully',
      interest: userInterest,
    };
  }

  async update(
    userId: string,
    updateUserInterestDto: UpdateUserInterestDto,
  ) {
    this.logger.info(
      { userId, interests: updateUserInterestDto.interest },
      'Updating user interest',
    );

    // Check if user interest exists
    const existingInterest = await this.prisma.client.userInterest.findUnique({
      where: { userId },
    });

    if (!existingInterest) {
      this.logger.warn({ userId }, 'User interest not found for update');
      throw new NotFoundError('User interest not found');
    }

    const updateData: any = {};
    if (updateUserInterestDto.interest !== undefined) {
      updateData.interest = updateUserInterestDto.interest;
    }
    if (updateUserInterestDto.photoURL !== undefined) {
      updateData.photoURL = updateUserInterestDto.photoURL;
    }

    const updatedInterest = await this.prisma.client.userInterest.update({
      where: { userId },
      data: updateData,
    });

    this.logger.info(
      { userId },
      'User interest updated successfully',
    );

    return {
      message: 'Interest updated successfully',
      interest: updatedInterest,
    };
  }

  async remove(userId: string) {
    this.logger.info({ userId }, 'Removing user interest');

    // Check if user interest exists
    const existingInterest = await this.prisma.client.userInterest.findUnique({
      where: { userId },
    });

    if (!existingInterest) {
      this.logger.warn({ userId }, 'User interest not found for removal');
      throw new NotFoundError('User interest not found');
    }

    await this.prisma.client.userInterest.delete({
      where: { userId },
    });

    this.logger.info({ userId }, 'User interest removed successfully');

    return {
      message: 'Interest removed successfully',
    };
  }

  async addInterest(userId: string, newInterest: string) {
    this.logger.info({ userId, newInterest }, 'Adding interest to user');

    const existingInterest = await this.prisma.client.userInterest.findUnique({
      where: { userId },
    });

    if (!existingInterest) {
      this.logger.warn({ userId }, 'User interest not found');
      throw new NotFoundError('User interest not found');
    }

    if (existingInterest.interest.includes(newInterest)) {
      throw new Error('Interest already exists');
    }

    const updatedInterests = [...existingInterest.interest, newInterest];

    const updatedInterest = await this.prisma.client.userInterest.update({
      where: { userId },
      data: { interest: updatedInterests },
    });

    this.logger.info({ userId, newInterest }, 'Interest added successfully');

    return {
      message: 'Interest added successfully',
      interest: updatedInterest,
    };
  }

  async removeInterest(userId: string, interestToRemove: string) {
    this.logger.info({ userId, interestToRemove }, 'Removing interest from user');

    const existingInterest = await this.prisma.client.userInterest.findUnique({
      where: { userId },
    });

    if (!existingInterest) {
      this.logger.warn({ userId }, 'User interest not found');
      throw new NotFoundError('User interest not found');
    }

    if (!existingInterest.interest.includes(interestToRemove)) {
      throw new Error('Interest not found');
    }

    const updatedInterests = existingInterest.interest.filter(
      (interest) => interest !== interestToRemove,
    );

    const updatedInterest = await this.prisma.client.userInterest.update({
      where: { userId },
      data: { interest: updatedInterests },
    });

    this.logger.info({ userId, interestToRemove }, 'Interest removed successfully');

    return {
      message: 'Interest removed successfully',
      interest: updatedInterest,
    };
  }
}
