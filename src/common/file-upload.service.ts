/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class FileUploadService {
  constructor(private readonly configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'social-app',
  ): Promise<string> {
    // Validate file
    if (!file || !file.buffer) {
      throw new Error('Invalid file provided');
    }

    // Check file size (limit to 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB');
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed',
      );
    }

    try {
      // Upload to Cloudinary
      const result = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'image',
            transformation: [
              { width: 1000, height: 1000, crop: 'limit' }, // Resize to max 1000x1000
              { quality: 'auto' }, // Auto quality optimization
            ],
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(file.buffer);
      });

      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload file to cloud storage');
    }
  }

  async uploadMultipleFiles(files: {
    profilePicture?: Express.Multer.File[];
    coverPhoto?: Express.Multer.File[];
  }): Promise<{ avatarUrl?: string; coverPhotoUrl?: string }> {
    const result: { avatarUrl?: string; coverPhotoUrl?: string } = {};

    if (files.profilePicture && files.profilePicture[0]) {
      result.avatarUrl = await this.uploadFile(
        files.profilePicture[0],
        'social-app/avatars',
      );
    }

    if (files.coverPhoto && files.coverPhoto[0]) {
      result.coverPhotoUrl = await this.uploadFile(
        files.coverPhoto[0],
        'social-app/covers',
      );
    }

    return result;
  }
}
