/**
 * OpenAI provider
 *
 * Pure fetch-based implementation — no openai package required.
 * Hits https://api.openai.com/v1/chat/completions with the same
 * system prompt and JSON response format as the Anthropic provider.
 * Also serves as the base class for DeepSeek and Ollama providers.
 */

import type { AIProvider, AIStepData, ChatMessage } from '../types';
import type { AITaskBreakdown } from '../../../types';
import { SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT, parseTaskBreakdown } from '../prompts';

interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatResponse {
  choices: { message: { content: string } }[];
}

export class OpenAIProvider implements AIProvider {
  protected apiKey: string;
  protected model: string;
  protected baseUrl: string;

  constructor(
    apiKey: string,
    model = 'gpt-4o-mini',
    baseUrl = 'https://api.openai.com',
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  protected async callAPI(
    messages: OpenAIChatMessage[],
    maxTokens = 1024,
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as OpenAIChatResponse;
    return data.choices[0]?.message?.content ?? '';
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

    const text = await this.callAPI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ]);
    return parseTaskBreakdown(text);
  }

  async regenerateStep(
    taskTitle: string,
    stepTitle: string,
    reason?: string,
  ): Promise<AIStepData> {
    const text = await this.callAPI(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `For the assignment "${taskTitle}", the student wants a different version of this step: "${stepTitle}"${reason ? `. Reason: ${reason}` : ''}.

Return ONLY JSON (no markdown):
{"title": "...", "detail": "...", "estimatedMinutes": 10}`,
        },
      ],
      256,
    );
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
    const text = await this.callAPI(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Student just completed: "${completedStep}" for "${taskTitle}". ${stepsLeft} steps remain.

Write ONE encouraging sentence (max 20 words). Be specific, warm, not cheesy. Return plain text only.`,
        },
      ],
      128,
    );
    return text.trim() || `Nice work — ${stepsLeft} step${stepsLeft !== 1 ? 's' : ''} to go.`;
  }

  async chat(messages: ChatMessage[], systemContext?: string): Promise<string> {
    const system = systemContext ? `${CHAT_SYSTEM_PROMPT}\n\n${systemContext}` : CHAT_SYSTEM_PROMPT;
    const apiMessages: OpenAIChatMessage[] = [
      { role: 'system', content: system },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];
    const text = await this.callAPI(apiMessages, 512);
    return text.trim() || "I'm here to help — what's on your mind?";
  }
}
