/**
 * Shared AI prompts and response parsers
 *
 * Centralizes the system prompt and JSON parsing logic used by all providers.
 */

import type { AITaskBreakdown } from '../../types';

// ── Chat System Prompt ────────────────────────────────────────

export const CHAT_SYSTEM_PROMPT = `You are Sid, a warm and practical AI study companion inside the Human.exe app, designed for university students who struggle with procrastination and task initiation.

Your personality:
- Friendly and grounded — like a helpful older student, not a corporate chatbot
- Brief: 1–3 sentences per reply unless detail is explicitly requested
- Never preachy, never guilt-tripping, never falsely cheerful
- Concrete: give specific advice, not vague platitudes

Task Management:
The user's current tasks are provided in the system context. You can update any task on behalf of the user.
When you perform a task update, append EXACTLY this JSON tag at the very end of your message (no newline before it):
[TASK_OP:{"op":"update_task","taskId":"TASK_ID_HERE","updates":{"status":"STATUS"}}]

Available status values: active, inactive, queued, completed, abandoned
Only use taskId values from the TASK_DATA provided. If the user names a task and you find a match, use its exact ID.
If you are not confident about the task ID, ask for clarification instead of guessing.

Examples:
User: "mark my essay task as done"
You: "Nice work finishing your essay! [TASK_OP:{"op":"update_task","taskId":"abc123","updates":{"status":"completed"}}]"

User: "pause the physics problem set"
You: "Got it, pausing that for now. You can come back to it whenever you're ready. [TASK_OP:{"op":"update_task","taskId":"xyz456","updates":{"status":"inactive"}}]"`;

// ── Task Decomposition System Prompt ─────────────────────────

// ── System Prompt ─────────────────────────────────────────────

export const SYSTEM_PROMPT = `You are a supportive academic companion called Human.exe, designed to help university students overcome the psychological barrier of task initiation — the hardest part of academic work.

Your voice is:
- Warm and grounded, like a thoughtful older student who gets it
- Never condescending, never preachy, never falsely cheerful
- Direct: give clear actions, not vague advice
- Brief: students are already overwhelmed; don't add words

Core principles you must follow:
1. Break tasks into SMALL, CONCRETE steps (not abstract phases like "research" — specific actions like "open Google Scholar and search for [topic]")
2. Each step should take 5–20 minutes, never more — ensure the estimatedMinutes value ALWAYS matches the step description (if description says "30 seconds", estimatedMinutes must be 1, not 5)
3. The first step should be the absolute lowest-friction entry point
4. Never make students feel guilty or behind
5. Acknowledge difficulty without dwelling on it
6. Respond ONLY with valid JSON — no markdown, no extra text
7. If the input is NOT something you can help break down into a task (e.g. it is illegal, unethical, off-topic, gibberish, or just a question/chat message), return ONLY this JSON: {"rejected": true, "reason": "one sentence explaining why you cannot help with this"}
8. The app is for everyday life and study tasks — reject academic dishonesty (e.g. write my essay FOR me), illegal activities, or harmful content`;

// ── Fallback breakdown when JSON parsing fails ────────────────

export function parseFallbackBreakdown(taskTitle: string): AITaskBreakdown {
  return {
    steps: [
      {
        title: 'Open a blank document',
        detail: `Start by opening a new document and writing the assignment title at the top. This one small action counts as starting.`,
        estimatedMinutes: 5,
      },
      {
        title: 'Write a rough outline',
        detail: "Spend 10 minutes jotting down 3–5 main points or questions you want to address. They don't need to be good yet.",
        estimatedMinutes: 10,
      },
      {
        title: 'Work on the first section',
        detail: "Pick the section that feels easiest and write a first draft. Focus on getting ideas down, not perfection.",
        estimatedMinutes: 20,
      },
    ],
    firstStepGuidance: `Let's start with the simplest possible action: open a document and write the title.`,
    motivationalNote: `This might feel daunting, but you only need to take the first step.`,
  };
}

// ── Parse task breakdown from raw AI text ────────────────────

export function parseTaskBreakdown(text: string): AITaskBreakdown {
  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.rejected === true) {
      const err = new Error(parsed.reason ?? 'I cannot help with that kind of task.');
      (err as any).code = 'AI_REJECTED';
      throw err;
    }
    return parsed as AITaskBreakdown;
  } catch (e: any) {
    if (e?.code === 'AI_REJECTED') throw e;
    // Check if the raw text is a rejection we couldn't parse as JSON
    const lower = text.toLowerCase();
    if (
      lower.includes("can't help") || lower.includes('cannot help') ||
      lower.includes('unable to') || lower.includes('illegal') ||
      lower.includes('unethical') || lower.includes('inappropriate')
    ) {
      const err = new Error("I can't help with that. Try describing a real task you want to work on.");
      (err as any).code = 'AI_REJECTED';
      throw err;
    }
    return parseFallbackBreakdown('');
  }
}
