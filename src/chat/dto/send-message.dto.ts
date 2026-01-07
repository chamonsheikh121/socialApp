import { IsString, IsOptional, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  conversationId: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUUID()
  replyToMessageId?: string;
}
