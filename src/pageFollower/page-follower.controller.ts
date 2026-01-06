import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PageFollowerService } from './page-follower.service';
import { CreatePageFollowerDto, GetPageFollowersDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Page Followers')
@Controller('page-followers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PageFollowerController {
  constructor(private readonly pageFollowerService: PageFollowerService) {}

  @Post()
  @ApiOperation({ summary: 'Follow a page' })
  @ApiResponse({ status: 201, description: 'Page followed successfully' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  @ApiResponse({ status: 409, description: 'Already following' })
  create(
    @CurrentUser('id') userId: string,
    @Body() createPageFollowerDto: CreatePageFollowerDto,
  ) {
    return this.pageFollowerService.create(userId, createPageFollowerDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all page followers with filters' })
  @ApiResponse({
    status: 200,
    description: 'Page followers retrieved successfully',
  })
  findAll(@Query() getPageFollowersDto: GetPageFollowersDto) {
    return this.pageFollowerService.findAll(getPageFollowersDto);
  }

  @Get('my-followed-pages')
  @ApiOperation({ summary: 'Get pages I follow' })
  @ApiResponse({
    status: 200,
    description: 'Followed pages retrieved successfully',
  })
  getMyFollowedPages(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.pageFollowerService.getUserFollowedPages(userId, page, limit);
  }

  @Get('page/:pageId')
  @ApiOperation({ summary: 'Get followers of a specific page' })
  @ApiResponse({
    status: 200,
    description: 'Page followers retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Page not found' })
  getPageFollowers(
    @Param('pageId') pageId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.pageFollowerService.getPageFollowers(pageId, page, limit);
  }

  @Get('is-following/:pageId')
  @ApiOperation({ summary: 'Check if user is following a page' })
  @ApiResponse({
    status: 200,
    description: 'Follow status retrieved successfully',
  })
  isFollowing(
    @CurrentUser('id') userId: string,
    @Param('pageId') pageId: string,
  ) {
    return this.pageFollowerService.isFollowing(userId, pageId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific page follower record by ID' })
  @ApiResponse({
    status: 200,
    description: 'Page follower retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Follower record not found' })
  findOne(@Param('id') id: string) {
    return this.pageFollowerService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a page follower' })
  @ApiResponse({
    status: 200,
    description: 'Unfollowed successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Follower record not found' })
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.pageFollowerService.remove(id, userId);
  }

  @Delete('unfollow/:pageId')
  @ApiOperation({ summary: 'Unfollow a page' })
  @ApiResponse({
    status: 200,
    description: 'Unfollowed successfully',
  })
  @ApiResponse({ status: 404, description: 'Not following this page' })
  unfollowPage(
    @CurrentUser('id') userId: string,
    @Param('pageId') pageId: string,
  ) {
    return this.pageFollowerService.unfollowPage(userId, pageId);
  }
}
