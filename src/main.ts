import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

import './lib/bullmq/email.worker';
import { GlobalExceptionFilter } from './common/error';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable WebSocket support
  app.useWebSocketAdapter(new IoAdapter(app));

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }
  const config = new DocumentBuilder()
    .setTitle('Social App')
    .setDescription('')
    .setVersion('1.0')
    // .addTag('cats')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT! || 5000;
  await app.listen(process.env.PORT ?? port);
  console.log(`the server running at http://localhost:${port}/api`);
}
bootstrap();
