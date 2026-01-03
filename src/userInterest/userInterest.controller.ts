import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Put,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserInterestService } from './userInterest.service';
import {
  CreateUserInterestDto,
  UpdateUserInterestDto,
} from './dto/create-userInterest.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { jwtPayloadDto } from '../auth/dto/jwtPayload.dto';

@ApiTags('User Interests')
@ApiBearerAuth()
@Controller('user/interests')
export class UserInterestController {
  constructor(private readonly userInterestService: UserInterestService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Create user interests' })
  @ApiResponse({ status: 201, description: 'Interests created successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - interests already exist',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  create(
    @CurrentUser() user: jwtPayloadDto,
    @Body() createUserInterestDto: CreateUserInterestDto,
  ) {
    return this.userInterestService.create(user.userId, createUserInterestDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get user interests' })
  @ApiResponse({ status: 200, description: 'Interests retrieved successfully' })
  findAll(@CurrentUser() user: jwtPayloadDto) {
    return this.userInterestService.findAll(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  @ApiOperation({ summary: 'Update user interests' })
  @ApiResponse({ status: 200, description: 'Interests updated successfully' })
  @ApiResponse({ status: 404, description: 'User interests not found' })
  update(
    @CurrentUser() user: jwtPayloadDto,
    @Body() updateUserInterestDto: UpdateUserInterestDto,
  ) {
    return this.userInterestService.update(user.userId, updateUserInterestDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  @ApiOperation({ summary: 'Remove all user interests' })
  @ApiResponse({ status: 200, description: 'Interests removed successfully' })
  @ApiResponse({ status: 404, description: 'User interests not found' })
  remove(@CurrentUser() user: jwtPayloadDto) {
    return this.userInterestService.remove(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  @ApiOperation({ summary: 'Add a single interest to user interests' })
  @ApiResponse({ status: 200, description: 'Interest added successfully' })
  @ApiResponse({ status: 404, description: 'User interests not found' })
  @ApiResponse({ status: 400, description: 'Interest already exists' })
  addInterest(
    @CurrentUser() user: jwtPayloadDto,
    @Body('interest') interest: string,
  ) {
    return this.userInterestService.addInterest(user.userId, interest);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('remove/:interest')
  @ApiOperation({ summary: 'Remove a single interest from user interests' })
  @ApiResponse({ status: 200, description: 'Interest removed successfully' })
  @ApiResponse({ status: 404, description: 'User interests or interest not found' })
  removeInterest(
    @CurrentUser() user: jwtPayloadDto,
    @Param('interest') interest: string,
  ) {
    return this.userInterestService.removeInterest(user.userId, interest);
  }
}
