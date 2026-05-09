/**
 * AI Provider interface types
 *
 * Defines the contract all AI providers must implement, enabling
 * seamless swapping between Anthropic, OpenAI, DeepSeek, Ollama, and Mock.
 */

import type { AITaskBreakdown } from '../../types';

export interface AIStepData {
  title: string;
  detail: string;
  estimatedMinutes: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AIProvider {
  decomposeTask(
    title: string,
    description: string,
    context?: string,
  ): Promise<AITaskBreakdown>;

  regenerateStep(
    taskTitle: string,
    stepTitle: string,
    reason?: string,
  ): Promise<AIStepData>;

  getStepEncouragement(
    taskTitle: string,
    completedStep: string,
    stepsLeft: number,
  ): Promise<string>;

  chat(
    messages: ChatMessage[],
    systemContext?: string,
  ): Promise<string>;
}
