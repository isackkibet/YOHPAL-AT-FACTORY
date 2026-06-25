import { ModerationProvider, ModerateInput, ModerationResult } from '../interfaces/moderation-provider.interface';

export class YohPalBrainModerationProvider implements ModerationProvider {
  async moderate(_input: ModerateInput): Promise<ModerationResult> {
    return {
      action: 'REVIEW',
      score: 0.72,
      reason: 'YohPal Brain moderation: pending review',
      metadata: { provider: 'yohpal_brain', engine: 'yohpal-moderation-v1' },
    };
  }
}
