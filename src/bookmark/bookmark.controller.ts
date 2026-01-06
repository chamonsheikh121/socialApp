import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';
import { GetBookmarksDto } from './dto/get-bookmarks.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { BookmarkService } from './bookmark.service';

@ApiTags('Bookmarks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookmarks')
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bookmark' })
  @ApiResponse({
    status: 201,
    description: 'Bookmark created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Bookmark already exists',
  })
  create(
    @CurrentUser('userId') userId: string,
    @Body() createBookmarkDto: CreateBookmarkDto,
  ) {
    return this.bookmarkService.create(userId, createBookmarkDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookmarks for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of bookmarks with pagination',
  })
  findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: GetBookmarksDto,
  ) {
    return this.bookmarkService.findAll(userId, query);
  }

  @Get('check/:contentId')
  @ApiOperation({ summary: 'Check if content is bookmarked' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark status',
  })
  checkBookmark(
    @CurrentUser('userId') userId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.bookmarkService.checkBookmark(userId, contentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific bookmark by ID' })
  @ApiParam({ name: 'id', description: 'Bookmark ID' })
  @ApiResponse({ status: 200, description: 'Bookmark details' })
  @ApiResponse({ status: 404, description: 'Bookmark not found' })
  findOne(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.bookmarkService.findOne(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a bookmark by ID' })
  @ApiParam({ name: 'id', description: 'Bookmark ID' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark removed successfully',
  })
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.bookmarkService.remove(id, userId);
  }

  @Delete('content/:contentId')
  @ApiOperation({ summary: 'Remove a bookmark by content ID' })
  @ApiParam({ name: 'contentId', description: 'Content ID' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark removed successfully',
  })
  removeByContent(
    @CurrentUser('userId') userId: string,
    @Param('contentId') contentId: string,
  ) {
    return this.bookmarkService.removeByContent(userId, contentId);
  }
}
