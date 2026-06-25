import { AvatarProvider } from '../interfaces/avatar-provider.interface';
import { env } from '../../../libs/common/env';

export class YohPalBrainAvatarProvider implements AvatarProvider {
  async generateAvatar(_options: { script: string; style?: string }) {
    return {
      avatarUrl: `${env.cdnBaseUrl}/brain/avatar.png`,
      metadata: { provider: 'yohpal_brain', engine: 'yohpal-avatar-v1' },
    };
  }
}
