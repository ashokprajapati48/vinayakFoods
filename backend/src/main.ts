import { NestFactory } from '@nestjs/core';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { SerializeInterceptor } from './common/interceptors/serialize.interceptor.js';
import { corsOrigin, configuredOrigins } from './common/cors.js';
import { serviceInfo } from './app.controller.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix — the root route is served unprefixed so that opening this
  // server in a browser explains itself instead of returning "Cannot GET /".
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // Friendly alias so /api (with no route) also answers.
  app.getHttpAdapter().get('/api', (_req: unknown, res: { json: (body: unknown) => void }) => {
    res.json(serviceInfo());
  });

  // CORS — allows the configured origins, or localhost + LAN devices by default.
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Prisma Decimal → number, so clients can do arithmetic on money fields.
  app.useGlobalInterceptors(new SerializeInterceptor());

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const allowed = configuredOrigins();
  console.log(`\n🚀 VINAYAK FOODS API running on http://localhost:${port}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`📋 API prefix: /api   ·   health: /api/health`);
  console.log(
    `🔐 CORS: ${allowed.length ? allowed.join(', ') : 'localhost + private LAN (default)'}\n`,
  );
}

bootstrap();
