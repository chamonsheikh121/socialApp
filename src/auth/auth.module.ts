import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';
import { MailModule } from '../lib/mail/mail.module';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [PrismaModule, RedisModule, MailModule, MetricsModule],
  providers: [
    AuthService,
    JwtAuthGuard,
    {
      provide: 'ACCESS_JWT',
      useFactory: (config: ConfigService) => {
        return new JwtService({
          secret: config.get('ACCESS_TOKEN_SECRET'),
          signOptions: {
            expiresIn: '1d',
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'REFRESH_JWT',
      useFactory: (config: ConfigService) => {
        return new JwtService({
          secret: config.get('REFRESH_TOKEN_SECRET'),
          signOptions: {
            expiresIn: '7d',
          },
        });
      },
      inject: [ConfigService],
    },
    {
      provide: 'RESET_PASS_JWT',
      useFactory: (config: ConfigService) => {
        return new JwtService({
          secret: config.get('RESET_PASS_TOKEN_SECRET'),
          signOptions: {
            expiresIn: '5m',
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [JwtAuthGuard, 'ACCESS_JWT'],
  controllers: [AuthController],
})
export class AuthModule {}
