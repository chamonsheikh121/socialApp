import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [PrismaModule, RedisModule],
  providers: [AuthService, ConfigService],
  controllers: [AuthController]
})
export class AuthModule {}
