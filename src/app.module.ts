/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { UserInterestModule } from './userInterest/userInterest.module';
import { InterestModule } from './interest/interest.module';
import { PostModule } from './post/post.module';
import { CategoryModule } from './category/category.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { BullMQModule } from './lib/bullmq/bullmq.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsMiddleware } from './metrics/metrics.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: {
          ignore: (req) => req.url?.includes('/metrics')!,
        },
        transport: {
          targets: [
            {
              target: 'pino-pretty',
              options: {
                singleLine: true,
              },
              level: 'info',
            },
            {
              target: 'pino-loki',
              options: {
                host: 'http://10.10.10.52:3100',
                batching: true,
                interval: 5,
                labels: {
                  app: 'socialapp',
                  service: 'nestjs',
                },
              },
              level: 'info',
            },
          ],
        },
      },
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    MetricsModule,
    AuthModule,
    UserModule,
    InterestModule,
    UserInterestModule,
    PostModule,
    CategoryModule,
    PrismaModule,
    BullMQModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
