import { Module } from '@nestjs/common';
import { InterestService } from './interest.service';
import { InterestController } from './interest.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InterestController],
  providers: [
    InterestService,
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
  exports: [InterestService],
})
export class InterestModule {}
