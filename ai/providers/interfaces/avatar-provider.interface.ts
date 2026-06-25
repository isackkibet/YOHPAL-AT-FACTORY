export interface AvatarProvider {
  generateAvatar(options: { script: string; style?: string }): Promise<{
    avatarUrl: string;
    metadata: Record<string, unknown>;
  }>;
}
