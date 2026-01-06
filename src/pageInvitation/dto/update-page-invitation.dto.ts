import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePageInvitationDto {
  @ApiPropertyOptional({
    description: 'Whether the invitation is accepted',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isAccepted?: boolean;
}
