/**
 * Anthropic Claude AI provider
 *
 * Uses @anthropic-ai/sdk to call Claude models for task decomposition,
 * step regeneration, step encouragement, and free-form chat.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIStepData, ChatMessage } from '../types';
import type { AITaskBreakdown } from '../../../types';
import { SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT, parseTaskBreakdown } from '../prompts';

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model = 'claude-sonnet-4-6') {
    this.client = new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
    this.model = model;
  }

  async decomposeTask(
    title: string,
    description: string,
    context?: string,
  ): Promise<AITaskBreakdown> {
    const userMessage = `
Assignment: ${title}
${description ? `Details: ${description}` : ''}
${context ? `About the student: ${context}` : ''}

Break this into 4–6 concrete, specific steps. Return ONLY this JSON (no markdown):
{
  "steps": [
    {
      "title": "Short action title (under 60 chars)",
      "detail": "Specific guidance for completing this step (2–3 sentences)",
      "estimatedMinutes": 10
    }
  ],
  "firstStepGuidance": "One encouraging sentence about starting the first step. Be specific to the assignment.",
  "motivationalNote": "One sentence acknowledging this might feel hard but reframing it as doable. Ground it in the specific task."
}`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: userMessage }],
      system: SYSTEM_PROMPT,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return parseTaskBreakdown(text);
  }

  async regenerateStep(
    taskTitle: string,
    stepTitle: string,
    reason?: string,
  ): Promise<AIStepData> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `For the assignment "${taskTitle}", the student wants a different version of this step: "${stepTitle}"${reason ? `. Reason: ${reason}` : ''}.

Return ONLY JSON (no markdown):
{"title": "...", "detail": "...", "estimatedMinutes": 10}`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { title: stepTitle, detail: 'Try breaking this into an even smaller action.', estimatedMinutes: 10 };
    }
  }

  async getStepEncouragement(
    taskTitle: string,
    completedStep: string,
    stepsLeft: number,
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 128,
      messages: [
        {
          role: 'user',
          content: `Student just completed: "${completedStep}" for "${taskTitle}". ${stepsLeft} steps remain.

Write ONE encouraging sentence (max 20 words). Be specific, warm, not cheesy. Return plain text only.`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    return text || `Nice work — ${stepsLeft} step${stepsLeft !== 1 ? 's' : ''} to go.`;
  }

  async chat(messages: ChatMessage[], systemContext?: string): Promise<string> {
    const system = systemContext ? `${CHAT_SYSTEM_PROMPT}\n\n${systemContext}` : CHAT_SYSTEM_PROMPT;
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 512,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
    return text || "I'm here to help — what's on your mind?";
  }
}
