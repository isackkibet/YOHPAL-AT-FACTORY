import { Module } from '@nestjs/common';
import { RenderController } from './render.controller';
import { RenderService } from './render.service';
import { PrismaService } from '../../../libs/database/prisma.service';

@Module({
  controllers: [RenderController],
  providers: [RenderService, PrismaService],
})
export class RenderModule {}
