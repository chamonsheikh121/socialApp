/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PrismaService } from 'src/common/prisma/prisma.service';

import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { NotFoundError } from '../common/error';
import { Injectable } from '@nestjs/common';
import { FileUploadService } from '../common/file-upload.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectPinoLogger(UserService.name) private readonly logger: PinoLogger,
    private readonly fileUploadService: FileUploadService,
    private readonly metricsService: MetricsService,
  ) {}

  async updateProfile(
    userId: string,
    updateData: any,
    files?: {
      profilePicture?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
    },
  ) {
    this.logger.info({ userId }, 'Updating user profile');

    // Check if user exists
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn({ userId }, 'User not found for profile update');
      throw new NotFoundError('User not found');
    }

    // Handle file uploads if files are provided
    let uploadedUrls: { avatarUrl?: string; coverPhotoUrl?: string } = {};
    if (files && (files.profilePicture?.length || files.coverPhoto?.length)) {
      try {
        uploadedUrls = await this.fileUploadService.uploadMultipleFiles(files);
        this.logger.info(
          { userId, uploadedUrls },
          'Files uploaded successfully',
        );
      } catch (error) {
        this.logger.error({ userId, error }, 'Failed to upload files');
        throw error; // Re-throw the specific file upload error
      }
    }

    // Filter out empty/undefined/null fields from updateData
    const filteredUpdateData = updateData && typeof updateData === 'object'
      ? Object.keys(updateData).reduce((acc, key) => {
          const value = updateData[key];
          // Only include fields that are not empty strings, undefined, or null
          if (value !== '' && value !== undefined && value !== null) {
            acc[key] = value;
          }
          return acc;
        }, {} as any)
      : {};

    // Prepare update data - only include fields that have values
    const updatePayload = {
      ...filteredUpdateData,
      ...uploadedUrls, // Include uploaded file URLs
      updatedAt: new Date(),
    };

    // Only update if there are actual changes
    if (Object.keys(updatePayload).length === 1 && updatePayload.updatedAt) {
      // Only updatedAt is being set, no actual data changes
      this.logger.info({ userId }, 'No changes to update');
      return {
        message: 'No changes made',
        user: user,
      };
    }

    // Update user profile
    const updatedUser = await this.prisma.client.user.update({
      where: { id: userId },
      data: updatePayload,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        bio: true,
        avatarUrl: true,
        coverPhotoUrl: true,
        location: true,
        phone: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.info({ userId }, 'User profile updated successfully');

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  async getProfile(userId: string) {
    const startTime = Date.now();

    try {
      this.logger.info({ userId }, 'Getting user profile');

      const user = await this.prisma.client.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          bio: true,
          avatarUrl: true,
          coverPhotoUrl: true,
          location: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        this.logger.error({ userId }, 'User not found for profile retrieval');
        throw new NotFoundError('User not found');
      }

      this.metricsService.incrementUserProfileGet();

      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      this.metricsService.recordUserProfileGetDuration(duration);

      return {
        message: 'Profile retrieved successfully',
        user,
      };
    } catch (error) {
      const duration = (Date.now() - startTime) / 1000; // Convert to seconds
      this.metricsService.recordUserProfileGetDuration(duration);
      throw error;
    }
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.client.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          bio: true,
          avatarUrl: true,
          coverPhotoUrl: true,
          location: true,
          phone: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      }),
      this.prisma.client.user.count(),
    ]);

    return {
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
