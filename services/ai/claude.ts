/**
 * AI service facade (backward-compatible)
 *
 * Thin wrappers that delegate to the currently-selected AIProvider via the factory.
 * All existing call-sites continue to work without changes.
 */

import { getAIProvider } from './factory';
import type { AITaskBreakdown } from '../../types';
import type { ChatMessage } from './types';

export async function decomposeTask(
  taskTitle: string,
  taskDescription: string,
  userContext?: string,
): Promise<AITaskBreakdown> {
  return getAIProvider().decomposeTask(taskTitle, taskDescription, userContext);
}

export async function regenerateStep(
  taskTitle: string,
  stepTitle: string,
  reason?: string,
): Promise<{ title: string; detail: string; estimatedMinutes: number }> {
  return getAIProvider().regenerateStep(taskTitle, stepTitle, reason);
}

export async function getStepEncouragement(
  taskTitle: string,
  completedStep: string,
  stepsRemaining: number,
): Promise<string> {
  return getAIProvider().getStepEncouragement(taskTitle, completedStep, stepsRemaining);
}

export async function chatWithAI(
  messages: ChatMessage[],
  systemContext?: string,
): Promise<string> {
  return getAIProvider().chat(messages, systemContext);
}
