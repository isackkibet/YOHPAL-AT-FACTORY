import { LlmScriptProvider } from '../interfaces/llm-script-provider.interface';

export class MockLlmProvider implements LlmScriptProvider {
  async generateScript(prompt: string, _context?: Record<string, unknown>) {
    return {
      title: `Mock: ${prompt.slice(0, 50)}`,
      hook: 'Did you know this amazing fact?',
      body: 'This is a mock generated script body for testing purposes.',
      cta: 'Subscribe for more!',
      metadata: { provider: 'mock', model: 'mock-llm-v1' },
    };
  }
}
