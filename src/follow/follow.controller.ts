import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { jwtPayloadDto } from '../auth/dto/jwtPayload.dto';

@ApiTags('follow')
@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':userId')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: 'ID of the user to follow' })
  followUser(
    @CurrentUser() currentUser: jwtPayloadDto,
    @Param('userId') followingId: string,
  ) {
    return this.followService.followUser(currentUser.userId, followingId);
  }

  @Delete('unfollow/:userId')
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({ name: 'userId', description: 'ID of the user to unfollow' })
  async unfollowUser(
    @CurrentUser() currentUser: jwtPayloadDto,
    @Param('userId') followingId: string,
  ) {
    return this.followService.unfollowUser(currentUser.userId, followingId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-followers')
  @ApiOperation({ summary: 'Get followers of the current user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  async getFollowers(
    @CurrentUser() currentUser: jwtPayloadDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followService.getFollowers(
      currentUser.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Get('me-following')
  @ApiOperation({ summary: 'Get users that the current user is following' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  async getFollowing(
    @CurrentUser('userId') currentUser: jwtPayloadDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followService.getFollowing(
      currentUser.userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get follow statistics for a user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  async getFollowStats(@Param('userId') userId: string) {
    return this.followService.getFollowStats(userId);
  }
}
