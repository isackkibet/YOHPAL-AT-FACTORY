import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import {
  CreateFeedEventRequest,
  CreateTrendRequest,
  CreateVideoJobRequest,
  GenerateScriptRequest,
  ModerateVideoRequest,
  RenderVideoRequest,
} from '../../../contracts/api-contracts';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  // Health
  @Get('health')
  async health() {
    return this.gatewayService.health();
  }

  // TREND
  @Post('trends')
  async createTrend(@Body() body: CreateTrendRequest) {
    return this.gatewayService.createTrend(body);
  }

  @Post('trends/discover-seed')
  async discoverSeedTrends() {
    return this.gatewayService.discoverSeedTrends();
  }

  @Get('trends')
  async listTrends(
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('take') take?: string
  ) {
    return this.gatewayService.listTrends({ category, region, country, take });
  }

  // SCRIPT
  @Post('scripts/generate')
  async generateScript(@Body() body: GenerateScriptRequest) {
    return this.gatewayService.generateScript(body);
  }

  @Post('scripts/generate-pending')
  async generatePendingScripts(@Query('take') take?: string) {
    return this.gatewayService.generatePendingScripts(take);
  }

  @Get('scripts')
  async listScripts(
    @Query('trendId') trendId?: string,
    @Query('language') language?: string,
    @Query('take') take?: string
  ) {
    return this.gatewayService.listScripts({ trendId, language, take });
  }

  // RENDER
  @Post('render/jobs')
  async createVideoJob(@Body() body: CreateVideoJobRequest) {
    return this.gatewayService.createVideoJob(body);
  }

  @Post('render/jobs/create-pending')
  async createPendingVideoJobs(@Query('take') take?: string) {
    return this.gatewayService.createPendingVideoJobs(take);
  }

  @Post('render/videos/render')
  async renderVideo(@Body() body: RenderVideoRequest) {
    return this.gatewayService.renderVideo(body);
  }

  @Post('render/videos/render-pending')
  async renderPendingVideos(@Query('take') take?: string) {
    return this.gatewayService.renderPendingVideos(take);
  }

  @Get('render/videos')
  async listVideos(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('take') take?: string
  ) {
    return this.gatewayService.listVideos({ status, category, region, country, take });
  }

  // MODERATION
  @Post('moderation/videos/moderate')
  async moderateVideo(@Body() body: ModerateVideoRequest) {
    return this.gatewayService.moderateVideo(body);
  }

  @Post('moderation/videos/moderate-pending')
  async moderatePendingVideos(@Query('take') take?: string) {
    return this.gatewayService.moderatePendingVideos(take);
  }

  @Post('moderation/videos/:id/publish')
  async publishApproved(@Param('id') id: string) {
    return this.gatewayService.publishApproved(id);
  }

  @Post('moderation/videos/publish-approved')
  async publishAllApproved(@Query('take') take?: string) {
    return this.gatewayService.publishAllApproved(take);
  }

  // RECOMMENDATION
  @Get('feed/seed')
  async getSeedFeed(
    @Query('userId') userId: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('language') language?: string,
    @Query('take') take?: string
  ) {
    return this.gatewayService.getSeedFeed({ userId, region, country, language, take });
  }

  @Post('feed/events')
  async createFeedEvent(@Body() body: CreateFeedEventRequest) {
    return this.gatewayService.createFeedEvent(body);
  }

  // ⚡ KILLER FEATURE: Run the entire pipeline in one call!
  @Post('pipeline/run-seed')
  async runSeedPipeline(@Query('take') take?: string) {
    return this.gatewayService.runSeedPipeline(take || '10');
  }
}
