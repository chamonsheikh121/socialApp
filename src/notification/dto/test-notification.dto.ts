import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class TestNotificationDto {
  @ApiProperty({
    description: 'User ID to send test notification to',
    example: 'cm5a1b2c3d4e5f6g7h8i9j0k',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Test notification message',
    example: 'This is a test notification',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Notification type for testing',
    example: 'TEST',
    required: false,
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Additional test data',
    example: { testKey: 'testValue' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;
}
