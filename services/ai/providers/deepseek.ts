/**
 * DeepSeek provider
 *
 * Connects to DeepSeek's OpenAI-compatible API.
 * DeepSeek is an open-weight model family with strong reasoning capability
 * and a generous free tier — ideal as the default AI for Human.exe.
 *
 * API docs: https://platform.deepseek.com/api-docs/
 * Default model: deepseek-chat (DeepSeek-V3)
 */

import { OpenAIProvider } from './openai';

export class DeepSeekProvider extends OpenAIProvider {
  constructor(apiKey: string, model = 'deepseek-chat') {
    super(apiKey, model, 'https://api.deepseek.com');
  }
}
