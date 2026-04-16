/**
 * AI Provider factory
 *
 * Reads current settings and returns the appropriate AIProvider.
 * Throws AINotConfiguredError when no API key is available so callers
 * can show a "Set up AI" prompt rather than silently failing.
 */

import type { AIProvider } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { OpenAIProvider } from './providers/openai';
import { OllamaProvider } from './providers/ollama';
import { DeepSeekProvider } from './providers/deepseek';
import { useSettingsStore } from '../../store/settingsStore';

const ENV_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const ENV_KEY_IS_PLACEHOLDER = !ENV_API_KEY || ENV_API_KEY === 'your_anthropic_api_key_here';

export class AINotConfiguredError extends Error {
  constructor() {
    super('No AI provider configured. Add an API key in Settings → AI Provider.');
    this.name = 'AINotConfiguredError';
  }
}

export function getAIProvider(): AIProvider {
  const settings = useSettingsStore.getState();

  switch (settings.aiProvider) {
    case 'deepseek': {
      if (!settings.deepseekApiKey) throw new AINotConfiguredError();
      return new DeepSeekProvider(settings.deepseekApiKey, settings.deepseekModel);
    }
    case 'anthropic': {
      const key = settings.anthropicApiKey || (ENV_KEY_IS_PLACEHOLDER ? '' : ENV_API_KEY);
      if (!key) throw new AINotConfiguredError();
      return new AnthropicProvider(key, settings.anthropicModel);
    }
    case 'openai': {
      if (!settings.openaiApiKey) throw new AINotConfiguredError();
      return new OpenAIProvider(settings.openaiApiKey, settings.openaiModel);
    }
    case 'ollama': {
      return new OllamaProvider(settings.ollamaBaseUrl, settings.ollamaModel);
    }
    default:
      throw new AINotConfiguredError();
  }
}
