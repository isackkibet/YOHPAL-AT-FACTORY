import { PrismaService } from './prisma.service';

export type ProviderJobType = 'LLM_SCRIPT' | 'TTS' | 'AVATAR_VIDEO' | 'VIDEO_COMPOSITE' | 'MODERATION';
export type ProviderJobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'FALLBACK_USED';

export class ProviderJobLogger {
  constructor(private readonly prisma: PrismaService) {}

  async start(input: { videoId?: string; jobType: ProviderJobType; providerName: string; requestPayload?: Record<string, unknown> }) {
    return this.prisma.providerJobLog.create({
      data: {
        videoId: input.videoId,
        jobType: input.jobType,
        providerName: input.providerName,
        status: 'RUNNING',
        requestPayload: input.requestPayload as any,
      },
    });
  }

  async success(input: { jobId: string; responsePayload?: Record<string, unknown>; fallbackUsed?: boolean }) {
    return this.prisma.providerJobLog.update({
      where: { id: input.jobId },
      data: {
        status: input.fallbackUsed ? 'FALLBACK_USED' : 'SUCCESS',
        responsePayload: input.responsePayload as any,
        fallbackUsed: input.fallbackUsed || false,
        completedAt: new Date(),
      },
    });
  }

  async fail(input: { jobId: string; errorMessage: string; fallbackUsed?: boolean; responsePayload?: Record<string, unknown> }) {
    return this.prisma.providerJobLog.update({
      where: { id: input.jobId },
      data: {
        status: input.fallbackUsed ? 'FALLBACK_USED' : 'FAILED',
        errorMessage: input.errorMessage,
        fallbackUsed: input.fallbackUsed || false,
        responsePayload: input.responsePayload as any,
        completedAt: new Date(),
      },
    });
  }
}
