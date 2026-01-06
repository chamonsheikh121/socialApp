import { Module } from '@nestjs/common';
import { PageFollowerService } from './page-follower.service';
import { PageFollowerController } from './page-follower.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PageFollowerController],
  providers: [PageFollowerService],
  exports: [PageFollowerService],
})
export class PageFollowerModule {}
