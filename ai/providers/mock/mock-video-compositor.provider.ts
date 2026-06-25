import { VideoCompositorProvider } from '../interfaces/video-compositor-provider.interface';
import { env } from '../../../libs/common/env';

export class MockVideoCompositorProvider implements VideoCompositorProvider {
  async compose(_input: { audioUrl: string; avatarUrl?: string; visuals: string[]; style?: string }) {
    return {
      videoUrl: `${env.cdnBaseUrl}/mock/video.mp4`,
      durationMs: 10000,
      metadata: { provider: 'mock', engine: 'mock-compositor-v1' },
    };
  }
}
