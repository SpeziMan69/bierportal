import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { ServerResponse } from 'node:http';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { UPLOAD_ROOT } from './common/upload/image-upload.options';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.useStaticAssets(UPLOAD_ROOT, {
    prefix: '/uploads',
    // Uploaded images are loaded cross-origin by the frontend, so relax helmet's same-origin CORP for them.
    setHeaders: (res: ServerResponse) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  const corsOrigin = process.env.CORS_ORIGIN?.split(',');
  if (!corsOrigin || corsOrigin.length === 0) {
    throw new Error('CORS_ORIGIN must be set in .env');
  }
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Bierportal API')
      .setDescription('Final project API')
      .setVersion('1.0')
      .addCookieAuth('token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
