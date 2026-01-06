import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreatePageInvitationDto {
  @ApiProperty({
    description: 'Page ID to invite user to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  pageId: string;

  @ApiProperty({
    description: 'User ID to be invited',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  receiverId: string;
}
