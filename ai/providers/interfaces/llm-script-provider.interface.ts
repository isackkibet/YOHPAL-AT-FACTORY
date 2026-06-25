export interface LlmScriptProvider {
  generateScript(prompt: string, context?: Record<string, unknown>): Promise<{
    title: string;
    hook: string;
    body: string;
    cta: string;
    metadata: Record<string, unknown>;
  }>;
}
