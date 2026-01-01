import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { BullMQModule } from './lib/bullmq/bullmq.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UserModule,
    PrismaModule,
    BullMQModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
