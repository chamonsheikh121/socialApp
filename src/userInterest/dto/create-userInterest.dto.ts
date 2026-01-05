import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AddUserInterestDto {
  @ApiProperty({
    description: 'Interest ID to add to user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  interestId: string;
}

export class AddMultipleUserInterestsDto {
  @ApiProperty({
    description: 'Array of interest IDs to add',
    example: [
      '123e4567-e89b-12d3-a456-426614174000',
      '223e4567-e89b-12d3-a456-426614174001',
    ],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  interestIds: string[];
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
