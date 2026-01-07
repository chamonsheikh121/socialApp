import { IsUUID, IsBoolean } from 'class-validator';

export class TypingIndicatorDto {
  @IsUUID()
  conversationId: string;

  @IsBoolean()
  isTyping: boolean;
}
