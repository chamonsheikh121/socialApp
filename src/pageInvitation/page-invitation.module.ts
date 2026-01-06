import { Module } from '@nestjs/common';
import { PageInvitationService } from './page-invitation.service';
import { PageInvitationController } from './page-invitation.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PageInvitationController],
  providers: [PageInvitationService],
  exports: [PageInvitationService],
})
export class PageInvitationModule {}
