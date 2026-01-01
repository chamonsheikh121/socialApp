import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RedisModule } from '../common/redis/redis.module';
import { MailModule } from '../lib/mail/mail.module';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    MailModule,
  ],
  providers: [
    AuthService,
    {
      provide: 'ACCESS_JWT',
      useFactory: (config: ConfigService) => {
        return new JwtService({
          secret: config.get('ACCESS_TOKEN_SECRET'),
          signOptions: {
            expiresIn: '15m',
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
  ],
  controllers: [AuthController],
})
export class AuthModule {}
