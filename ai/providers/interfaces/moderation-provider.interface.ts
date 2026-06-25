export type ModerationAction = 'ALLOW' | 'LIMIT' | 'REVIEW' | 'BLOCK';

export interface ModerationResult {
  action: ModerationAction;
  score: number;
  reason: string;
  metadata: Record<string, unknown>;
}

export interface ModerateInput {
  title: string;
  text: string;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  category: string;
  language: string;
}

export interface ModerationProvider {
  moderate(input: ModerateInput): Promise<ModerationResult>;
}
