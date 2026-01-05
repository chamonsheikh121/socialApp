import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment text',
    example: 'Great post!',
  })
  @IsString()
  @IsNotEmpty()
  commentText: string;

  @ApiProperty({
    description: 'Post ID to comment on',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for replies',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  parentCommentId?: string;
}
