import { Module } from '@nestjs/common';
import { UserInterestController } from './userInterest.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { UserInterestService } from './userInterest.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UserInterestController],
  providers: [
    UserInterestService,
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
  ],
  exports: [UserInterestService],
})
export class UserInterestModule {}
