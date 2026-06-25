import { env } from '../../backend/shared/env';
import { LlmScriptProvider } from './interfaces/llm-script-provider.interface';
import { TtsProvider } from './interfaces/tts-provider.interface';
import { AvatarProvider } from './interfaces/avatar-provider.interface';
import { VideoCompositorProvider } from './interfaces/video-compositor-provider.interface';
import { ModerationProvider } from './interfaces/moderation-provider.interface';
import { MockLlmProvider } from './mock/mock-llm.provider';
import { MockTtsProvider } from './mock/mock-tts.provider';
import { MockAvatarProvider } from './mock/mock-avatar.provider';
import { MockVideoCompositorProvider } from './mock/mock-video-compositor.provider';
import { MockModerationProvider } from './mock/mock-moderation.provider';
import { YohPalBrainLlmProvider } from './yohpal-brain/yohpal-brain-llm.provider';
import { YohPalBrainTtsProvider } from './yohpal-brain/yohpal-brain-tts.provider';
import { YohPalBrainAvatarProvider } from './yohpal-brain/yohpal-brain-avatar.provider';
import { YohPalBrainVideoCompositorProvider } from './yohpal-brain/yohpal-brain-video-compositor.provider';
import { YohPalBrainModerationProvider } from './yohpal-brain/yohpal-brain-moderation.provider';

function isYohPalBrainEnabled(providerName?: string): boolean {
  return providerName === 'yohpal_brain';
}

export function createLlmProvider(): LlmScriptProvider {
  if (isYohPalBrainEnabled(process.env.LLM_PROVIDER)) return new YohPalBrainLlmProvider();
  return new MockLlmProvider();
}

export function createTtsProvider(): TtsProvider {
  if (isYohPalBrainEnabled(env.ttsProvider)) return new YohPalBrainTtsProvider();
  return new MockTtsProvider();
}

export function createAvatarProvider(): AvatarProvider {
  if (isYohPalBrainEnabled(env.avatarProvider)) return new YohPalBrainAvatarProvider();
  return new MockAvatarProvider();
}

export function createVideoCompositorProvider(): VideoCompositorProvider {
  if (isYohPalBrainEnabled(env.videoRenderProvider)) return new YohPalBrainVideoCompositorProvider();
  return new MockVideoCompositorProvider();
}

export function createModerationProvider(): ModerationProvider {
  if (isYohPalBrainEnabled(process.env.MODERATION_PROVIDER)) return new YohPalBrainModerationProvider();
  return new MockModerationProvider();
}
