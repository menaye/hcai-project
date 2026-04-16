/**
 * Ollama provider
 *
 * Connects to a local Ollama instance using its OpenAI-compatible endpoint.
 * No API key required. Defaults to http://localhost:11434.
 */

import { OpenAIProvider } from './openai';

export class OllamaProvider extends OpenAIProvider {
  constructor(baseUrl = 'http://localhost:11434', model = 'llama3.2') {
    // Ollama's OpenAI-compatible endpoint — no auth key needed
    super('ollama', model, baseUrl);
  }
}
