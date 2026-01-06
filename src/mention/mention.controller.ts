import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MentionService } from './mention.service';
import { CreateMentionDto, UpdateMentionDto, GetMentionsDto } from './dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Mentions')
@Controller('mentions')
export class MentionController {
  constructor(private readonly mentionService: MentionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new mention' })
  @ApiResponse({ status: 201, description: 'Mention created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User, Post, or Comment not found' })
  create(
    @CurrentUser('userId') userId: string,
    @Body() createMentionDto: CreateMentionDto,
  ) {
    return this.mentionService.create(userId, createMentionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all mentions with optional filters' })
  @ApiResponse({ status: 200, description: 'Mentions retrieved successfully' })
  findAll(@Query() query: GetMentionsDto) {
    return this.mentionService.findAll(query);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all mentions for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'User mentions retrieved successfully',
  })
  getUserMentions(@Param('userId') userId: string) {
    return this.mentionService.getUserMentions(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single mention by ID' })
  @ApiResponse({ status: 200, description: 'Mention retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Mention not found' })
  findOne(@Param('id') id: string) {
    return this.mentionService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a mention' })
  @ApiResponse({ status: 200, description: 'Mention updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Mention not found' })
  update(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @Body() updateMentionDto: UpdateMentionDto,
  ) {
    return this.mentionService.update(id, userId, updateMentionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a mention' })
  @ApiResponse({ status: 200, description: 'Mention deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Mention not found' })
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.mentionService.remove(id, userId);
  }
}
