import { TtsProvider } from '../interfaces/tts-provider.interface';
import { env } from '../../../libs/common/env';

export class YohPalBrainTtsProvider implements TtsProvider {
  async synthesize(_text: string, _options?: { language?: string; voice?: string }) {
    return {
      audioUrl: `${env.cdnBaseUrl}/brain/audio.mp3`,
      durationMs: 5000,
      metadata: { provider: 'yohpal_brain', engine: 'yohpal-tts-v1' },
    };
  }
}
