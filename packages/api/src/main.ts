/**
 * Application bootstrap for the CleanOps API.
 * Sets up global validation, Swagger, and starts the Nest server.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Response } from 'express';

import { AppModule } from './app/app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  const corsOrigins = configService.get<string>('http.corsOrigins')?.split(',') ?? [];
  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('CleanOps API')
    .setDescription('REST API for the CleanOps field work completion platform')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const openapiPath = configService.get<string>('openapi.path');
  if (openapiPath) {
    const resolved = join(process.cwd(), openapiPath);
    try {
      const yamlContent = readFileSync(resolved, 'utf8');
      const httpAdapter = app.getHttpAdapter();
      const instance = httpAdapter.getInstance();
      instance.get('/openapi.yaml', (_req: unknown, res: Response) => {
        res.type('text/yaml').send(yamlContent);
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`OpenAPI file not found at ${resolved}`, error);
    }
  }

  const port = configService.get<number>('http.port') ?? 3000;
  await app.listen(port, '0.0.0.0');
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to bootstrap CleanOps API', error);
  process.exit(1);
});
