import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({
    description: 'Updated comment text',
    example: 'Updated comment text',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  commentText?: string;
}
