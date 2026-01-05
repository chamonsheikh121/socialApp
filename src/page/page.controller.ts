import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PageService } from './page.service';
import { CreatePageDto, UpdatePageDto, AddPageAdminDto } from './dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Pages')
@Controller('pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new page (owner automatically becomes admin)',
  })
  @ApiResponse({ status: 201, description: 'Page created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  create(
    @CurrentUser('userId') userId: string,
    @Body() createPageDto: CreatePageDto,
  ) {
    return this.pageService.create(userId, createPageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all pages' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Pages retrieved successfully' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.pageService.findAll(page, limit);
  }

  @Get('my-pages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get pages owned by current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'User pages retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyPages(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.pageService.getMyPages(userId, page, limit);
  }

  @Get('username/:username')
  @ApiOperation({ summary: 'Get page by username' })
  @ApiParam({ name: 'username', description: 'Page username' })
  @ApiResponse({ status: 200, description: 'Page retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  findByUsername(@Param('username') username: string) {
    return this.pageService.findByUsername(username);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single page by ID' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  @ApiResponse({ status: 200, description: 'Page retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  findOne(@Param('id') id: string) {
    return this.pageService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a page (owner or admin only)' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  @ApiResponse({ status: 200, description: 'Page updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Page not found' })
  update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updatePageDto: UpdatePageDto,
  ) {
    return this.pageService.update(id, userId, updatePageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a page (owner only)' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  @ApiResponse({ status: 200, description: 'Page deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only owner can delete',
  })
  @ApiResponse({ status: 404, description: 'Page not found' })
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.pageService.remove(id, userId);
  }

  @Post(':id/admins')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add admin to page (owner only)' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  @ApiResponse({ status: 201, description: 'Admin added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only owner can add admins',
  })
  @ApiResponse({ status: 404, description: 'Page or user not found' })
  @ApiResponse({ status: 409, description: 'User is already a page admin' })
  addAdmin(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() addPageAdminDto: AddPageAdminDto,
  ) {
    return this.pageService.addAdmin(id, userId, addPageAdminDto);
  }

  @Delete(':id/admins/:adminUserId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove admin from page (owner only)' })
  @ApiParam({ name: 'id', description: 'Page ID' })
  @ApiParam({ name: 'adminUserId', description: 'Admin user ID to remove' })
  @ApiResponse({ status: 200, description: 'Admin removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - only owner can remove admins',
  })
  @ApiResponse({ status: 404, description: 'Page or admin not found' })
  removeAdmin(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Param('adminUserId') adminUserId: string,
  ) {
    return this.pageService.removeAdmin(id, userId, adminUserId);
  }
}
