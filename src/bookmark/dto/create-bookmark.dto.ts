import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

export enum PostType {
  USER_POST = 'USER_POST',
  PAGE_POST = 'PAGE_POST',
  USER_REEL = 'USER_REEL',
  PAGE_REEL = 'PAGE_REEL',
  USER_VIDEO = 'USER_VIDEO',
  PAGE_VIDEO = 'PAGE_VIDEO',
}

export class CreateBookmarkDto {
  @ApiProperty({
    description: 'Type of content being bookmarked',
    enum: PostType,
    example: PostType.USER_POST,
  })
  @IsEnum(PostType)
  @IsNotEmpty()
  PostType: PostType;

  @ApiProperty({
    description: 'Content ID (Post ID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  contentId: string;
}
