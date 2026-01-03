import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CreateUserInterestDto {
  @ApiProperty({
    description: 'Array of interest categories',
    example: ['Technology', 'Sports', 'Music'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  interest: string[];

  @ApiProperty({
    description: 'Photo URL for the user interest',
    example: 'https://example.com/photo.jpg',
  })
  @IsString()
  @IsNotEmpty()
  photoURL: string;
}

export class UpdateUserInterestDto {
  @ApiProperty({
    description: 'Array of interest categories',
    example: ['Technology', 'Sports', 'Music'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  interest?: string[];

  @ApiProperty({
    description: 'Photo URL for the user interest',
    example: 'https://example.com/photo.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  photoURL?: string;
}

export class UserInterestResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the user interest',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'The user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Photo URL for the user interest',
    example: 'https://example.com/photo.jpg',
  })
  photoURL: string;

  @ApiProperty({
    description: 'Array of interest categories',
    example: ['Technology', 'Sports', 'Music'],
  })
  interest: string[];
}
