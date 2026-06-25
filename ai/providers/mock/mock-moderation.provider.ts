import { ModerationProvider, ModerateInput, ModerationResult } from '../interfaces/moderation-provider.interface';

export class MockModerationProvider implements ModerationProvider {
  async moderate(_input: ModerateInput): Promise<ModerationResult> {
    return {
      action: 'REVIEW',
      score: 0.7,
      reason: 'Mock moderation: pending human review',
      metadata: { provider: 'mock', engine: 'mock-moderation-v1' },
    };
  }
}
