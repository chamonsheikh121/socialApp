import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

export class CreateInterestDto {
  @ApiProperty({
    description: 'The title of the interest',
    example: 'Technology',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Canvas URL for the interest image',
    example: 'https://example.com/canvas/tech.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  canvasUrl?: string;
}

export class UpdateInterestDto {
  @ApiProperty({
    description: 'The title of the interest',
    example: 'Technology',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ApiProperty({
    description: 'Canvas URL for the interest image',
    example: 'https://example.com/canvas/tech.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  canvasUrl?: string;
}
