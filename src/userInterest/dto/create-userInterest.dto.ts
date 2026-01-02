import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateUserInterestDto {
  @ApiProperty({
    description: 'The interest category',
    example: 'Technology',
  })
  @IsString()
  @IsNotEmpty()
  category: string;
}

export class UpdateUserInterestDto {
  @ApiProperty({
    description: 'The interest category',
    example: 'Technology',
  })
  @IsString()
  @IsNotEmpty()
  category: string;
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
    description: 'The interest category',
    example: 'Technology',
  })
  category: string;

  @ApiProperty({
    description: 'The creation timestamp',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;
}
