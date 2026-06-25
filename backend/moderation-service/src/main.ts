import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ModerationModule } from './moderation.module';
import { env } from '../../shared/env';

async function bootstrap() {
  const app = await NestFactory.create(ModerationModule);
  app.enableCors({ origin: '*' });
  await app.listen(env.moderationServicePort);
  console.log(`✅ YohPal Live Moderation Service running on port ${env.moderationServicePort}`);
}
bootstrap();
