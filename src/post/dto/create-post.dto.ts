import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PostType } from 'generated/prisma/enums';

export class CreatePostDto {
  @ApiProperty({
    description: 'Post content',
    example: 'This is my first post!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Post type',
    enum: PostType,
    default: PostType.USER_POST,
  })
  @IsEnum(PostType)
  @IsOptional()
  postType?: PostType;

  @ApiPropertyOptional({
    description: 'Is post public',
    default: true,
  })
  @Transform(({ value }): boolean | undefined => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Hashtags for post (without # symbol)',
    type: [String],
    example: ['javascript', 'nodejs', 'web-development'],
  })
  @Transform(({ value }): string[] | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as string[]) : [value];
      } catch {
        return [value];
      }
    }
    return [String(value)];
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  hashtags?: string[];

  @ApiPropertyOptional({
    description: 'Category IDs to associate with post',
    type: [String],
    example: ['category-id-1', 'category-id-2'],
  })
  @Transform(({ value }): string[] | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as string[]) : [value];
      } catch {
        return [value];
      }
    }
    return [String(value)];
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({
    description: 'Image files to upload (max 10 files)',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
  })
  @IsOptional()
  images?: Express.Multer.File[];
}
