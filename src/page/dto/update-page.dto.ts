import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdatePageDto {
  @ApiPropertyOptional({
    description: 'Page name',
    example: 'My Awesome Page',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Page description',
    example: 'Updated description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Page avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Page cover photo URL',
    example: 'https://example.com/cover.jpg',
  })
  @IsString()
  @IsOptional()
  coverPhotoUrl?: string;
}
