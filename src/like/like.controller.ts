import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { ToggleLikeDto, GetLikesDto } from './dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Likes')
@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post('toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle like on a post (like/unlike)' })
  @ApiResponse({ status: 200, description: 'Like toggled successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  toggleLike(
    @CurrentUser('userId') userId: string,
    @Body() toggleLikeDto: ToggleLikeDto,
  ) {
    return this.likeService.toggleLike(userId, toggleLikeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all likes with optional filters' })
  @ApiResponse({ status: 200, description: 'Likes retrieved successfully' })
  getLikes(@Query() query: GetLikesDto) {
    return this.likeService.getLikes(query);
  }

  @Get('check/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user liked a post' })
  @ApiParam({ name: 'postId', description: 'Post ID to check' })
  @ApiResponse({ status: 200, description: 'Like status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  checkUserLiked(
    @CurrentUser('userId') userId: string,
    @Param('postId') postId: string,
  ) {
    return this.likeService.checkUserLiked(userId, postId);
  }

  @Get('my-likes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all posts liked by current user' })
  @ApiResponse({
    status: 200,
    description: 'User likes retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyLikes(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.likeService.getUserLikes(userId, page, limit);
  }
}
