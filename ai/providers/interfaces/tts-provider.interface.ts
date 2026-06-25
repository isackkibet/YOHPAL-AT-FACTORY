export interface TtsProvider {
  synthesize(text: string, options?: { language?: string; voice?: string }): Promise<{
    audioUrl: string;
    durationMs: number;
    metadata: Record<string, unknown>;
  }>;
}
