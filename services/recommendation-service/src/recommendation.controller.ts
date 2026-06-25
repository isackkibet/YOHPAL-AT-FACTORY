import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import {
  CreateFeedEventRequest,
  SeedFeedRequest,
} from '../../../contracts/api-contracts';
import { ok } from '../../../libs/common/http-response';

@Controller()
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('feed/seed')
  async getSeedFeed(
    @Query('userId') userId: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('language') language?: string,
    @Query('take') take?: string
  ) {
    const request: SeedFeedRequest = {
      userId,
      region,
      country,
      language,
      take: take ? Number(take) : undefined,
    };
    const feed = await this.recommendationService.getSeedFeed(request);
    return ok(feed, { count: feed.length });
  }

  @Post('feed/events')
  async createFeedEvent(@Body() body: CreateFeedEventRequest) {
    const event = await this.recommendationService.createFeedEvent(body);
    return ok(event, { message: 'Feed event recorded' });
  }

  @Get('videos/:id')
  async getVideoById(@Param('id') id: string) {
    const video = await this.recommendationService.getVideoById(id);
    return ok(video);
  }
}
