/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Body,
  Put,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { jwtPayloadDto } from '../auth/dto/jwtPayload.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('my-profile')
  async getProfile(@CurrentUser() user: jwtPayloadDto) {
    return this.userService.getProfile(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.getAllUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('update-my-profile')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'profilePicture', maxCount: 1 },
        { name: 'coverPhoto', maxCount: 1 },
      ],
      {
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB limit
        },
        fileFilter: (req, file, callback) => {
          // Allow only image files
          if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            return callback(new Error('Only image files are allowed!'), false);
          }
          callback(null, true);
        },
      },
    ),
  )
  @ApiConsumes('multipart/form-data') // tells Swagger this endpoint accepts files
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        bio: { type: 'string' },
        location: { type: 'string' },
        phone: { type: 'string' },
        profilePicture: {
          type: 'string',
          format: 'binary', // this tells Swagger it's a file
        },
        coverPhoto: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async updateProfile(
    @CurrentUser() user: jwtPayloadDto,
    @Req() req: Request,
    @UploadedFiles()
    files?: {
      profilePicture?: Express.Multer.File[];
      coverPhoto?: Express.Multer.File[];
    },
  ) {
    // Extract form fields from the request body (multipart form data)
    const updateData = {
      fullName: req.body.fullName,
      bio: req.body.bio,
      location: req.body.location,
      phone: req.body.phone,
    };

    return this.userService.updateProfile(user.userId, updateData, files);
  }
}
