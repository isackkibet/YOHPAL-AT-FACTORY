import { Module } from '@nestjs/common';
import { ModerationController } from './moderation.controller';
import { ProviderLogsController } from './provider-logs.controller';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../../../libs/database/prisma.service';

@Module({
  controllers: [ModerationController, ProviderLogsController],
  providers: [ModerationService, PrismaService],
})
export class ModerationModule {}
