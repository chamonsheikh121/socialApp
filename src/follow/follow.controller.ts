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
  async followUser(
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

  @Get('followers/:userId')
  @ApiOperation({ summary: 'Get followers of a user' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  async getFollowers(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followService.getFollowers(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('following/:userId')
  @ApiOperation({ summary: 'Get users that a user is following' })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  async getFollowing(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followService.getFollowing(
      userId,
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
