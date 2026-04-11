/**
 * Claude AI service
 *
 * Integrates Anthropic's Claude API for:
 *  1. Task decomposition – breaks an assignment into 3–6 concrete, manageable steps
 *  2. First-step generation – returns a single, immediately actionable first step
 *  3. Contextual encouragement – short, supportive messages grounded in the task
 *
 * Design principles applied (from needfinding report):
 *  - Tone is supportive & nonjudgmental (Appendix D §14.5)
 *  - Returns ONE clear action at a time to reduce decision paralysis (§14.1)
 *  - Steps are small enough to feel like mastery experiences (§14.3, Bandura 1997)
 *  - No excessive cheerleading — genuine, grounded encouragement only
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AITaskBreakdown } from '../../types';
import { mockDecomposeTask, mockRegenerateStep, mockGetEncouragement } from '../mock/mockAI';

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const AI_MOCK_MODE = !apiKey || apiKey === 'your_anthropic_api_key_here';

const client = AI_MOCK_MODE
  ? null
  : new Anthropic({
      apiKey,
      dangerouslyAllowBrowser: true, // Required for React Native / Expo
    });

const MODEL = 'claude-haiku-4-5-20251001'; // Fast, cost-effective for interactive use

// ── System prompt ─────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a supportive academic companion called Human.exe, designed to help university students overcome the psychological barrier of task initiation — the hardest part of academic work.

Your voice is:
- Warm and grounded, like a thoughtful older student who gets it
- Never condescending, never preachy, never falsely cheerful
- Direct: give clear actions, not vague advice
- Brief: students are already overwhelmed; don't add words

Core principles you must follow:
1. Break tasks into SMALL, CONCRETE steps (not abstract phases like "research" — specific actions like "open Google Scholar and search for [topic]")
2. Each step should take 5–20 minutes, never more
3. The first step should be the absolute lowest-friction entry point
4. Never make students feel guilty or behind
5. Acknowledge difficulty without dwelling on it
6. Respond ONLY with valid JSON — no markdown, no extra text`;

// ── Task Decomposition ────────────────────────────────────────

export async function decomposeTask(
  taskTitle: string,
  taskDescription: string,
  userContext?: string,
): Promise<AITaskBreakdown> {
  if (AI_MOCK_MODE) return mockDecomposeTask(taskTitle);

  const userMessage = `
Assignment: ${taskTitle}
${taskDescription ? `Details: ${taskDescription}` : ''}
${userContext ? `About the student: ${userContext}` : ''}

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

  const response = await client!.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: userMessage }],
    system: SYSTEM_PROMPT,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    // Strip any accidental markdown fences
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as AITaskBreakdown;
  } catch {
    // Graceful fallback if JSON parsing fails
    return {
      steps: [
        {
          title: 'Open a blank document',
          detail: `Start by opening a new document and writing the assignment title at the top. This one small action counts as starting.`,
          estimatedMinutes: 5,
        },
        {
          title: 'Write a rough outline',
          detail: 'Spend 10 minutes jotting down 3–5 main points or questions you want to address. They don\'t need to be good yet.',
          estimatedMinutes: 10,
        },
        {
          title: 'Work on the first section',
          detail: 'Pick the section that feels easiest and write a first draft. Focus on getting ideas down, not perfection.',
          estimatedMinutes: 20,
        },
      ],
      firstStepGuidance: `Let's start with the simplest possible action: open a document and write the title.`,
      motivationalNote: `This might feel daunting, but you only need to take the first step.`,
    };
  }
}

// ── Regenerate a single step ──────────────────────────────────

export async function regenerateStep(
  taskTitle: string,
  stepTitle: string,
  reason?: string,
): Promise<{ title: string; detail: string; estimatedMinutes: number }> {
  if (AI_MOCK_MODE) return mockRegenerateStep(stepTitle);

  const response = await client!.messages.create({
    model: MODEL,
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

// ── Step completion encouragement ─────────────────────────────

export async function getStepEncouragement(
  taskTitle: string,
  completedStep: string,
  stepsRemaining: number,
): Promise<string> {
  if (AI_MOCK_MODE) return mockGetEncouragement(completedStep, stepsRemaining);

  const response = await client!.messages.create({
    model: MODEL,
    max_tokens: 128,
    messages: [
      {
        role: 'user',
        content: `Student just completed: "${completedStep}" for "${taskTitle}". ${stepsRemaining} steps remain.

Write ONE encouraging sentence (max 20 words). Be specific, warm, not cheesy. Return plain text only.`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  return text || `Nice work — ${stepsRemaining} step${stepsRemaining !== 1 ? 's' : ''} to go.`;
}
