import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfig } from './config/app-config';

export async function createApp(): Promise<NestFastifyApplication> {
  // Body limit must be configured on the Fastify adapter itself, not on the
  // running app. We accept it via env at construction time.
  const bodyLimit = Number(process.env.BODY_LIMIT_BYTES ?? 1_048_576);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit, trustProxy: true }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(ConfigService<AppConfig, true>);

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });
  const corsOrigin = config.get('CORS_ORIGIN', { infer: true }) as string;
  await app.register(fastifyCors, {
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((s) => s.trim()),
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Smart Logistics Routing API')
    .setDescription('Graph-based shortest-path routing service.')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'api-key')
    .addTag('network')
    .addTag('route')
    .addTag('health')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  return app;
}

async function bootstrap(): Promise<void> {
  const app = await createApp();
  const config = app.get(ConfigService<AppConfig, true>);
  const port = config.get('PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
}

if (require.main === module) {
  bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Fatal bootstrap error:', err);
    process.exit(1);
  });
}
