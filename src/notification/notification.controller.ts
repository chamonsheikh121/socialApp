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
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { TestNotificationDto } from './dto/test-notification.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationGateway } from './notification.gateway';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
  })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }
  @Post('/test')
  @ApiOperation({ summary: 'Send test notification via WebSocket' })
  @ApiResponse({
    status: 201,
    description: 'Test notification sent successfully',
  })
  createTestNotification(@Body() testNotificationDto: TestNotificationDto) {
    this.notificationGateway.pushNotificationToUser(
      testNotificationDto.userId,
      {
        message: testNotificationDto.message,
        type: testNotificationDto.type || 'TEST',
        data: testNotificationDto.data,
      },
    );
    return {
      success: true,
      message: 'Test notification sent',
      userId: testNotificationDto.userId,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of notifications with pagination',
  })
  findAll(
    @CurrentUser('userId') userId: string,
    @Query() query: GetNotificationsDto,
  ) {
    return this.notificationService.findAll(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  @ApiResponse({
    status: 200,
    description: 'Unread notification count',
  })
  getUnreadCount(@CurrentUser('userId') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification details' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  findOne(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.notificationService.findOne(id, userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
  })
  markAsRead(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  markAllAsRead(@CurrentUser('userId') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.notificationService.remove(id, userId);
  }
}
