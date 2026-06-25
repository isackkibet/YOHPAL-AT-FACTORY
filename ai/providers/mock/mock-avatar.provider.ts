import { AvatarProvider } from '../interfaces/avatar-provider.interface';
import { env } from '../../../libs/common/env';

export class MockAvatarProvider implements AvatarProvider {
  async generateAvatar(_options: { script: string; style?: string }) {
    return {
      avatarUrl: `${env.cdnBaseUrl}/mock/avatar.png`,
      metadata: { provider: 'mock', engine: 'mock-avatar-v1' },
    };
  }
}
