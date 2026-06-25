import { TtsProvider } from '../interfaces/tts-provider.interface';
import { env } from '../../../libs/common/env';

export class MockTtsProvider implements TtsProvider {
  async synthesize(_text: string, _options?: { language?: string; voice?: string }) {
    return {
      audioUrl: `${env.cdnBaseUrl}/mock/audio.mp3`,
      durationMs: 5000,
      metadata: { provider: 'mock', engine: 'mock-tts-v1' },
    };
  }
}
