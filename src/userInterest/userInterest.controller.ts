import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UserInterestService } from './userInterest.service';
import {
  AddUserInterestDto,
  AddMultipleUserInterestsDto,
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
  @Post('add')
  @ApiOperation({ summary: 'Add a single interest to user' })
  @ApiResponse({ status: 201, description: 'Interest added successfully' })
  @ApiResponse({ status: 400, description: 'User already has this interest' })
  @ApiResponse({ status: 404, description: 'User or Interest not found' })
  addInterest(
    @CurrentUser() user: jwtPayloadDto,
    @Body() dto: AddUserInterestDto,
  ) {
    return this.userInterestService.addInterest(user.userId, dto.interestId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add-multiple')
  @ApiOperation({ summary: 'Add multiple interests to user' })
  @ApiResponse({ status: 201, description: 'Interests added successfully' })
  @ApiResponse({
    status: 400,
    description: 'One or more interests already exist',
  })
  @ApiResponse({ status: 404, description: 'User or Interest not found' })
  addMultipleInterests(
    @CurrentUser() user: jwtPayloadDto,
    @Body() dto: AddMultipleUserInterestsDto,
  ) {
    return this.userInterestService.addMultipleInterests(user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get current user interests' })
  @ApiResponse({ status: 200, description: 'Interests retrieved successfully' })
  getUserInterests(@CurrentUser() user: jwtPayloadDto) {
    return this.userInterestService.getUserInterests(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':interestId')
  @ApiOperation({ summary: 'Remove a single interest from user' })
  @ApiResponse({ status: 200, description: 'Interest removed successfully' })
  @ApiResponse({ status: 404, description: 'User interest not found' })
  removeInterest(
    @CurrentUser() user: jwtPayloadDto,
    @Param('interestId') interestId: string,
  ) {
    return this.userInterestService.removeInterest(user.userId, interestId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  @ApiOperation({ summary: 'Remove all interests from user' })
  @ApiResponse({
    status: 200,
    description: 'All interests removed successfully',
  })
  removeAllInterests(@CurrentUser() user: jwtPayloadDto) {
    return this.userInterestService.removeAllInterests(user.userId);
  }
}
