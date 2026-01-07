import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export class CreateConversationDto {
  @IsEnum(ConversationType)
  type: ConversationType;

  @IsOptional()
  @IsString()
  name?: string; // Required for group chats

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  participantIds: string[]; // User IDs to add to conversation
}
