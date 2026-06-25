import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { RecommendationModule } from './recommendation.module';
import { env } from '../../../libs/common/env';

async function bootstrap() {
  const app = await NestFactory.create(RecommendationModule);
  app.enableCors({ origin: '*' });
  await app.listen(env.recommendationServicePort);
  console.log(`✅ YohPal Live Recommendation Service running on port ${env.recommendationServicePort}`);
}
bootstrap();
