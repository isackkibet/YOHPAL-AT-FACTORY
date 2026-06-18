import { Injectable, NotFoundException } from '@nestjs/common';
import { ModerationAction } from '@prisma/client';
import { PrismaService } from '../../shared/prisma.service';
import { publishEvent } from '../../shared/kafka';
import { env } from '../../shared/env';
import { KafkaTopics } from '../../../contracts/kafka-events';
import { ModerateVideoRequest } from '../../../contracts/api-contracts';

type ModerationResult = {
  action: ModerationAction;
  score: number;
  reason: string;
  metadata: {
    textRiskScore: number;
    mediaRiskScore: number;
    copyrightRiskScore: number;
    brandSafetyScore: number;
    factSafetyScore: number;
    requiresHumanReview: boolean;
    sensitiveCategory: boolean;
    blockedTerms: string[];
  };
};

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async moderateVideo(input: ModerateVideoRequest) {
    const video = await this.prisma.video.findUnique({
      where: { id: input.videoId },
      include: {
        script: true,
        score: true,
        creator: true,
        moderationLogs: true,
      },
    });

    if (!video) {
      throw new NotFoundException(`Video not found: ${input.videoId}`);
    }

    if (!video.script) {
      throw new Error(`Video ${video.id} cannot be moderated without a script`);
    }

    const result = this.evaluateVideo(video);

    const log = await this.prisma.moderationLog.create({
      data: {
        videoId: video.id,
        action: result.action,
        score: result.score,
        reason: result.reason,
        metadata: result.metadata as any,
      },
    });

    const nextStatus =
      result.action === 'ALLOW' ? 'APPROVED' :
      result.action === 'LIMIT' ? 'APPROVED' :
      result.action === 'REVIEW' ? 'MODERATION' :
      'REJECTED';

    const updatedVideo = await this.prisma.video.update({
      where: { id: video.id },
      data: {
        status: nextStatus,
      },
    });

    await publishEvent(
      KafkaTopics.VIDEO_MODERATED,
      {
        videoId: video.id,
        action: result.action,
        score: result.score,
        reason: result.reason,
      },
      video.id
    );

    return {
      video: updatedVideo,
      moderationLog: log,
      result,
    };
  }

  async moderatePendingVideos(take = 20) {
    const videos = await this.prisma.video.findMany({
      where: {
        status: 'MODERATION',
        videoUrl: {
          not: null,
        },
      },
      orderBy: { createdAt: 'asc' },
      take,
    });

    const moderated = [];
    for (const video of videos) {
      moderated.push(await this.moderateVideo({ videoId: video.id }));
    }
    return moderated;
  }

  async listModerationQueue(params: {
    action?: ModerationAction;
    take?: number;
  }) {
    return this.prisma.moderationLog.findMany({
      where: {
        action: params.action,
      },
      include: {
        video: {
          include: {
            script: true,
            creator: true,
            score: true,
          },
        },
      },
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
      include: {
        moderationLogs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!video) {
      throw new NotFoundException(`Video not found: ${videoId}`);
    }

    if (video.status !== 'APPROVED') {
      throw new Error(
        `Video must be APPROVED before publishing. Current status: ${video.status}`
      );
    }

    const latestLog = video.moderationLogs[0];
    if (!latestLog || !['ALLOW', 'LIMIT'].includes(latestLog.action)) {
      throw new Error('Video cannot be published without passing moderation');
    }

    const published = await this.prisma.video.update({
      where: { id: video.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
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

  private evaluateVideo(video: {
    title: string;
    category: string;
    videoUrl: string | null;
    script: {
      title: string;
      hook: string;
      body: string;
      cta: string | null;
      factScore: number;
      qualityScore: number;
    } | null;
    score: {
      viralProbability: number;
      engagementScore: number;
      qualityScore: number;
    } | null;
    creator: {
      trustScore: number;
    } | null;
  }): ModerationResult {
    const text = [
      video.title,
      video.script?.title,
      video.script?.hook,
      video.script?.body,
      video.script?.cta,
    ]
      .filter(Boolean)
      .join('')
      .toLowerCase();

    const blockedTerms = this.findBlockedTerms(text);
    const sensitiveCategory = this.isSensitiveCategory(video.category);

    const textRiskScore = blockedTerms.length > 0 ? 0.9 : 0.12;
    const mediaRiskScore = video.videoUrl ? 0.08 : 0.35;
    const copyrightRiskScore = 0.12;
    const brandSafetyScore = blockedTerms.length > 0 ? 0.35 : 0.92;
    const factSafetyScore = video.script?.factScore ?? 0.75;
    const creatorTrustScore = (video.creator?.trustScore ?? 80) / 100;

    const safetyScore =
      brandSafetyScore * 0.3 +
      factSafetyScore * 0.25 +
      creatorTrustScore * 0.15 +
      (1 - textRiskScore) * 0.15 +
      (1 - mediaRiskScore) * 0.1 +
      (1 - copyrightRiskScore) * 0.05;

    const requiresHumanReview =
      sensitiveCategory ||
      factSafetyScore < 0.75 ||
      safetyScore < env.moderationThreshold ||
      blockedTerms.length > 0;

    let action: ModerationAction = 'ALLOW';
    let reason = 'Passed automated moderation';

    if (blockedTerms.length > 0) {
      action = 'BLOCK';
      reason = `Blocked terms detected: ${blockedTerms.join(', ')}`;
    } else if (requiresHumanReview) {
      action = 'REVIEW';
      reason = 'Requires human moderation review';
    } else if (safetyScore < 0.85) {
      action = 'LIMIT';
      reason = 'Approved with limited distribution';
    }

    return {
      action,
      score: Number(safetyScore.toFixed(4)),
      reason,
      metadata: {
        textRiskScore,
        mediaRiskScore,
        copyrightRiskScore,
        brandSafetyScore,
        factSafetyScore,
        requiresHumanReview,
        sensitiveCategory,
        blockedTerms,
      },
    };
  }

  private findBlockedTerms(text: string): string[] {
    const blocked = [
      'guaranteed profit',
      'cure disease',
      'vote for',
      'hate speech',
      'tribe is better',
      'free money guaranteed',
      'medical advice',
      'legal advice',
      'kill',
      'scam guaranteed',
    ];
    return blocked.filter((term) => text.includes(term));
  }

  private isSensitiveCategory(category: string): boolean {
    const sensitiveCategories = [
      'politics',
      'health',
      'finance',
      'religion',
      'ethnicity',
      'crime',
      'children',
      'breaking_news',
      'legal',
      'medical',
    ];
    return sensitiveCategories.includes(category.toLowerCase());
  }
}
