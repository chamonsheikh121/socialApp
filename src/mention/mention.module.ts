import { Module } from '@nestjs/common';
import { MentionService } from './mention.service';
import { MentionController } from './mention.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MentionController],
  providers: [MentionService],
  exports: [MentionService],
})
export class MentionModule {}
