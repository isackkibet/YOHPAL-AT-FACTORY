import { VideoCompositorProvider } from '../interfaces/video-compositor-provider.interface';
import { env } from '../../../libs/common/env';

export class YohPalBrainVideoCompositorProvider implements VideoCompositorProvider {
  async compose(_input: { audioUrl: string; avatarUrl?: string; visuals: string[]; style?: string }) {
    return {
      videoUrl: `${env.cdnBaseUrl}/brain/video.mp4`,
      durationMs: 10000,
      metadata: { provider: 'yohpal_brain', engine: 'yohpal-compositor-v1' },
    };
  }
}
