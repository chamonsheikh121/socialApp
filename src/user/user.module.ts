import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../common/prisma/prisma.module';
import { FileUploadService } from '../common/file-upload.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [AuthModule, PrismaModule, MetricsModule],
  controllers: [UserController],
  providers: [
    UserService,
    FileUploadService,
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
  ],
})
export class UserModule {}
