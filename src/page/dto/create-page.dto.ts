import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

export class CreatePageDto {
  @ApiProperty({
    description: 'Page name',
    example: 'My Awesome Page',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Page username (unique)',
    example: 'myawesomepage',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9._]+$/, {
    message:
      'Username must be lowercase letters, numbers, dots, and underscores only',
  })
  username: string;

  @ApiPropertyOptional({
    description: 'Page description',
    example: 'This is an awesome page about technology',
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
