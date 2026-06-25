import { Injectable, NotFoundException } from '@nestjs/common';
import { ModerationAction } from '@prisma/client';
import { PrismaService } from '../../shared/prisma.service';
import { publishEvent } from '../../shared/kafka';
import { env } from '../../shared/env';
import { KafkaTopics } from '../../../contracts/kafka-events';
import { ModerateVideoRequest } from '../../../contracts/api-contracts';
import { createModerationProvider } from '../../../ai/providers/provider-factory';
import { ProviderJobLogger } from '../../shared/provider-job-logger';

type ProviderModerationAction = 'ALLOW' | 'LIMIT' | 'REVIEW' | 'BLOCK';

@Injectable()
export class ModerationService {
  private readonly moderationProvider = createModerationProvider();
  private readonly providerJobLogger: ProviderJobLogger;

  constructor(private readonly prisma: PrismaService) {
    this.providerJobLogger = new ProviderJobLogger(prisma);
  }

  async moderateVideo(input: ModerateVideoRequest) {
    const video = await this.prisma.video.findUnique({
      where: { id: input.videoId },
      include: { script: true, score: true, creator: true },
    });
    if (!video) throw new NotFoundException(`Video not found: ${input.videoId}`);
    if (!video.script) throw new Error(`Video ${video.id} cannot be moderated without a script`);

    const text = [video.script.title, video.script.hook, video.script.body, video.script.cta]
      .filter(Boolean)
      .join('\n\n');

    const providerResult = await this.safeModerateWithProvider({
      title: video.title,
      text,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl,
      category: video.category,
      language: video.language,
      videoId: video.id,
    });

    const action = this.toPrismaModerationAction(providerResult.action);
    const log = await this.prisma.moderationLog.create({
      data: {
        videoId: video.id,
        action,
        score: providerResult.score,
        reason: providerResult.reason,
        metadata: {
          ...providerResult.metadata,
          provider: process.env.MODERATION_PROVIDER || 'mock',
          fallbackUsed: providerResult.fallbackUsed,
        } as any,
      },
    });

    const nextStatus = action === 'ALLOW' || action === 'LIMIT' ? 'APPROVED' : action === 'REVIEW' ? 'MODERATION' : 'REJECTED';
    const updatedVideo = await this.prisma.video.update({
      where: { id: video.id },
      data: { status: nextStatus },
    });

    await publishEvent(
      KafkaTopics.VIDEO_MODERATED,
      { videoId: video.id, action, score: providerResult.score, reason: providerResult.reason },
      video.id
    );

    return { video: updatedVideo, moderationLog: log, result: providerResult };
  }

  async moderatePendingVideos(take = 20) {
    const videos = await this.prisma.video.findMany({
      where: { status: 'MODERATION', videoUrl: { not: null } },
      orderBy: { createdAt: 'asc' },
      take,
    });
    const moderated = [];
    for (const video of videos) {
      moderated.push(await this.moderateVideo({ videoId: video.id }));
    }
    return moderated;
  }

  async listModerationQueue(params: { action?: ModerationAction; take?: number }) {
    return this.prisma.moderationLog.findMany({
      where: { action: params.action },
      include: { video: { include: { script: true, creator: true, score: true } } },
      orderBy: { createdAt: 'desc' },
      take: params.take || 50,
    });
  }

  async getModerationHistory(videoId: string) {
    return this.prisma.moderationLog.findMany({
      where: { videoId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async publishApprovedVideo(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { moderationLogs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!video) throw new NotFoundException(`Video not found: ${videoId}`);
    if (video.status !== 'APPROVED') throw new Error(`Video must be APPROVED before publishing. Current: ${video.status}`);
    const latestLog = video.moderationLogs[0];
    if (!latestLog || !['ALLOW', 'LIMIT'].includes(latestLog.action)) {
      throw new Error('Video cannot be published without passing moderation');
    }

    const published = await this.prisma.video.update({
      where: { id: video.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    await publishEvent(
      KafkaTopics.VIDEO_PUBLISHED,
      {
        videoId: published.id,
        publishedAt: published.publishedAt?.toISOString() || new Date().toISOString(),
        region: published.region,
        country: published.country,
        language: published.language,
      },
      published.id
    );

    return published;
  }

  async publishAllApproved(take = 20) {
    const videos = await this.prisma.video.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'asc' },
      take,
    });
    const published = [];
    for (const video of videos) {
      published.push(await this.publishApprovedVideo(video.id));
    }
    return published;
  }

  private async safeModerateWithProvider(input: {
    title: string;
    text: string;
    videoUrl: string | null;
    thumbnailUrl: string | null;
    category: string;
    language: string;
    videoId: string;
  }): Promise<{
    action: ProviderModerationAction;
    score: number;
    reason: string;
    metadata: Record<string, unknown>;
    fallbackUsed: boolean;
  }> {
    const providerName = process.env.MODERATION_PROVIDER || 'mock';
    const job = await this.providerJobLogger.start({
      videoId: input.videoId,
      jobType: 'MODERATION',
      providerName,
      requestPayload: { title: input.title, category: input.category, language: input.language },
    });

    try {
      const result = await this.moderationProvider.moderate({
        title: input.title,
        text: input.text,
        videoUrl: input.videoUrl,
        thumbnailUrl: input.thumbnailUrl,
        category: input.category,
        language: input.language,
      });
      await this.providerJobLogger.success({
        jobId: job.id,
        responsePayload: { action: result.action, score: result.score, reason: result.reason },
      });
      return { ...result, fallbackUsed: false };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown moderation provider failure';
      const fallbackAllowed = process.env.ALLOW_MODERATION_FALLBACK === 'true' || providerName === 'mock';
      if (!fallbackAllowed) throw error;

      await this.providerJobLogger.fail({
        jobId: job.id,
        errorMessage: message,
        fallbackUsed: true,
      });

      const localFallback = this.localFallbackModeration(input.title, input.text);
      return {
        ...localFallback,
        metadata: { ...localFallback.metadata, providerFailure: true, providerFailureReason: message },
        fallbackUsed: true,
      };
    }
  }

  private localFallbackModeration(title: string, text: string): {
    action: ProviderModerationAction;
    score: number;
    reason: string;
    metadata: Record<string, unknown>;
  } {
    const combined = `${title} ${text}`.toLowerCase();
    const blockedTerms = [
      'guaranteed profit', 'cure disease', 'vote for', 'hate speech',
      'tribe is better', 'free money guaranteed', 'medical advice',
      'legal advice', 'kill', 'scam guaranteed',
    ].filter((term) => combined.includes(term));

    if (blockedTerms.length > 0) {
      return {
        action: 'BLOCK',
        score: 0.25,
        reason: `Fallback blocked terms detected: ${blockedTerms.join(', ')}`,
        metadata: { blockedTerms, fallbackEngine: 'local_keyword_safety' },
      };
    }

    return {
      action: 'REVIEW',
      score: 0.7,
      reason: 'Fallback moderation requires human review',
      metadata: { fallbackEngine: 'local_keyword_safety' },
    };
  }

  private toPrismaModerationAction(action: ProviderModerationAction): ModerationAction {
    return action as ModerationAction;
  }

  // Manual Approve
  async manualApprove(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video) throw new NotFoundException(`Video not found: ${videoId}`);

    await this.prisma.moderationLog.create({
      data: {
        videoId: video.id,
        action: 'ALLOW',
        score: 1.0,
        reason: 'Manually approved by moderator',
        metadata: { manualOverride: true, moderatorAction: 'APPROVE' },
      },
    });

    const updated = await this.prisma.video.update({
      where: { id: video.id },
      data: { status: 'APPROVED' },
    });

    await publishEvent(
      KafkaTopics.VIDEO_MODERATED,
      { videoId: video.id, action: 'ALLOW', score: 1.0, reason: 'Manually approved' },
      video.id
    );

    return updated;
  }

  // Manual Reject
  async manualReject(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!video) throw new NotFoundException(`Video not found: ${videoId}`);

    await this.prisma.moderationLog.create({
      data: {
        videoId: video.id,
        action: 'BLOCK',
        score: 0.0,
        reason: 'Manually rejected by moderator',
        metadata: { manualOverride: true, moderatorAction: 'REJECT' },
      },
    });

    const updated = await this.prisma.video.update({
      where: { id: video.id },
      data: { status: 'REJECTED' },
    });

    await publishEvent(
      KafkaTopics.VIDEO_MODERATED,
      { videoId: video.id, action: 'BLOCK', score: 0.0, reason: 'Manually rejected' },
      video.id
    );

    return updated;
  }
}
