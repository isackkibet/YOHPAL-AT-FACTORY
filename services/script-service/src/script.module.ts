import { Module } from '@nestjs/common';
import { ScriptController } from './script.controller';
import { ScriptService } from './script.service';
import { PrismaService } from '../../../libs/database/prisma.service';

@Module({
  controllers: [ScriptController],
  providers: [ScriptService, PrismaService],
})
export class ScriptModule {}
