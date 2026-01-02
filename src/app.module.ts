import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { UserInterestModule } from './userInterest/userInterest.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { BullMQModule } from './lib/bullmq/bullmq.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    PrometheusModule.register(),
    AuthModule,
    UserModule,
    UserInterestModule,
    PrismaModule,
    BullMQModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
