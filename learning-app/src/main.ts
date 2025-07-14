import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { PrismaExceptionInterceptor } from './interceptors/prisma-exception.interceptor';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envFile = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.local';

const envPath = path.resolve(process.cwd(), envFile);

dotenv.config({ path: envPath });

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all log levels
  });

  app.enableCors({
    origin: ['http://localhost:3015', 'http://14.225.217.9:3015', 'https://attendance-app.io.vn'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new PrismaExceptionInterceptor());

  const configService = app.get(ConfigService);
  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
