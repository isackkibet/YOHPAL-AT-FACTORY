import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ModerationAction } from '@prisma/client';
import { ModerationService } from './moderation.service';
import { ModerateVideoRequest } from '../../../contracts/api-contracts';
import { ok } from '../../shared/http-response';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('videos/moderate')
  async moderateVideo(@Body() body: ModerateVideoRequest) {
    const result = await this.moderationService.moderateVideo(body);
    return ok(result, { message: 'Video moderation completed' });
  }

  @Post('videos/moderate-pending')
  async moderatePendingVideos(@Query('take') take?: string) {
    const result = await this.moderationService.moderatePendingVideos(
      take ? Number(take) : 20
    );
    return ok(result, { count: result.length });
  }

  @Post('videos/:id/publish')
  async publishApprovedVideo(@Param('id') id: string) {
    const result = await this.moderationService.publishApprovedVideo(id);
    return ok(result, { message: 'Approved video published' });
  }

  @Post('videos/publish-approved')
  async publishAllApproved(@Query('take') take?: string) {
    const result = await this.moderationService.publishAllApproved(
      take ? Number(take) : 20
    );
    return ok(result, { count: result.length });
  }

  @Get('queue')
  async listModerationQueue(
    @Query('action') action?: ModerationAction,
    @Query('take') take?: string
  ) {
    const result = await this.moderationService.listModerationQueue({
      action,
      take: take ? Number(take) : undefined,
    });
    return ok(result, { count: result.length });
  }

  @Get('videos/:id/history')
  async getModerationHistory(@Param('id') id: string) {
    const result = await this.moderationService.getModerationHistory(id);
    return ok(result, { count: result.length });
  }
}
