import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateMentionDto {
  @ApiProperty({
    description: 'User ID who is being mentioned',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  mentionedUserId: string;

  @ApiPropertyOptional({
    description: 'Post ID where the mention occurred',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  postId?: string;

  @ApiPropertyOptional({
    description: 'Page Post ID where the mention occurred',
    example: '123e4567-e89b-12d3-a456-426614174009',
  })
  @IsUUID()
  @IsOptional()
  pagePostId?: string;

  @ApiPropertyOptional({
    description: 'Comment ID where the mention occurred',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsOptional()
  commentId?: string;
}
