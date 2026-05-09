/**
 * Mock / Built-in AI provider
 *
 * A smart, context-aware fallback that works completely offline —
 * no API key required. Used when MOCK_MODE is active or no provider key is set.
 *
 * The chat() method reads the user's actual message, parses task context,
 * and produces helpful contextual replies including task operation action blocks.
 */

import type { AIProvider, AIStepData, ChatMessage } from '../types';
import type { AITaskBreakdown } from '../../../types';
import { mockDecomposeTask, mockRegenerateStep, mockGetEncouragement } from '../../mock/mockAI';

interface TaskEntry {
  id: string;
  title: string;
  status: string;
}

export class MockProvider implements AIProvider {
  async decomposeTask(
    title: string,
    _description: string,
    _context?: string,
  ): Promise<AITaskBreakdown> {
    return mockDecomposeTask(title);
  }

  async regenerateStep(
    _taskTitle: string,
    stepTitle: string,
    _reason?: string,
  ): Promise<AIStepData> {
    return mockRegenerateStep(stepTitle);
  }

  async getStepEncouragement(
    _taskTitle: string,
    completedStep: string,
    stepsLeft: number,
  ): Promise<string> {
    return mockGetEncouragement(completedStep, stepsLeft);
  }

  async chat(messages: ChatMessage[], systemContext?: string): Promise<string> {
    const lastMsg = messages[messages.length - 1]?.content ?? '';
    const lower = lastMsg.toLowerCase().trim();
    const ctx = systemContext ?? '';

    // Parse structured task data injected by the chat screen
    const tasks = this.parseTasks(ctx);
    const studentName = this.parseField(ctx, 'Student');
    const activeTasks = tasks.filter((t) => t.status === 'active');
    const queuedTasks = tasks.filter((t) => t.status === 'queued');
    const inactiveTasks = tasks.filter((t) => t.status === 'inactive');

    // ── TASK OPERATIONS ───────────────────────────────────────

    // Complete a task: "complete X", "mark X as done", "finished X", "done with X"
    const completePattern = /(?:complete|finish|finished|done with|mark.*done|completed?)\s+["']?(.+?)["']?\s*$/i;
    const completeMatch = lastMsg.match(completePattern);
    if (completeMatch) {
      const task = this.findTask(tasks, completeMatch[1]);
      if (task) {
        return `Great job finishing "${task.title}"! That's a real win. [TASK_OP:{"op":"update_task","taskId":"${task.id}","updates":{"status":"completed","completedAt":${Date.now()}}}]`;
      }
    }

    // Pause / deactivate a task
    const pausePattern = /(?:pause|stop|hold off on|put.*hold|set.*inactive|deactivate)\s+["']?(.+?)["']?\s*$/i;
    const pauseMatch = lastMsg.match(pausePattern);
    if (pauseMatch) {
      const task = this.findTask(tasks, pauseMatch[1]);
      if (task) {
        return `"${task.title}" is now paused. It'll be there when you're ready to come back to it. [TASK_OP:{"op":"update_task","taskId":"${task.id}","updates":{"status":"inactive"}}]`;
      }
    }

    // Activate / start a task
    const activatePattern = /(?:activate|start|reactivate|begin|work on|set.*active)\s+["']?(.+?)["']?\s*$/i;
    const activateMatch = lastMsg.match(activatePattern);
    if (activateMatch) {
      const task = this.findTask(tasks, activateMatch[1]);
      if (task && task.status !== 'active') {
        return `"${task.title}" is now active! The first step is always the hardest — you've got this. [TASK_OP:{"op":"update_task","taskId":"${task.id}","updates":{"status":"active"}}]`;
      }
    }

    // Queue a task
    const queuePattern = /(?:queue|add to queue|schedule|plan to do)\s+["']?(.+?)["']?\s*$/i;
    const queueMatch = lastMsg.match(queuePattern);
    if (queueMatch) {
      const task = this.findTask(tasks, queueMatch[1]);
      if (task && task.status !== 'queued') {
        return `"${task.title}" added to your queue. I'll remind you it's waiting when you're done with what's in front of you. [TASK_OP:{"op":"update_task","taskId":"${task.id}","updates":{"status":"queued"}}]`;
      }
    }

    // ── TASK QUERIES ──────────────────────────────────────────

    // List tasks
    if (/(?:my|list|show|what are my|tell me my)\s+tasks?/i.test(lower) || lower === 'tasks') {
      if (tasks.length === 0) {
        return "You don't have any tasks yet. Tap the + button on the Tasks tab to create one — I can help you break it down once it's there.";
      }
      const lines: string[] = [];
      if (activeTasks.length > 0) lines.push(`Active: ${activeTasks.map((t) => `"${t.title}"`).join(', ')}`);
      if (queuedTasks.length > 0) lines.push(`Queued: ${queuedTasks.map((t) => `"${t.title}"`).join(', ')}`);
      if (inactiveTasks.length > 0) lines.push(`Paused: ${inactiveTasks.map((t) => `"${t.title}"`).join(', ')}`);
      return lines.join('. ') + '. Which one do you want to focus on?';
    }

    // Ask about a specific task
    const aboutMatch = tasks.find((t) =>
      lower.includes(t.title.toLowerCase().substring(0, Math.min(t.title.length, 20)).toLowerCase()),
    );
    if (aboutMatch && /(?:how|what|help|tell me about|working on)/i.test(lower)) {
      return `For "${aboutMatch.title}": what part feels most overwhelming right now? Sometimes just naming the specific blocker makes it easier to tackle.`;
    }

    // ── EMOTIONAL / MOTIVATIONAL ──────────────────────────────

    if (/(?:stuck|can't start|don't know where|overwhelm|lost|confused|hard to start|procrastinat)/i.test(lower)) {
      if (activeTasks.length > 0) {
        return `Being stuck on "${activeTasks[0].title}" is normal. Try the 2-minute rule: commit to just 2 minutes on the very first step. You can stop after. Usually you won't want to.`;
      }
      return "Being stuck is about anxiety, not laziness. The trick is making the first action so small it's almost silly not to do it. What task is giving you trouble?";
    }

    if (/(?:tired|exhausted|burnout|can't do this|hate this|awful|terrible)/i.test(lower)) {
      return "That's real. If you need a break, take one — but a short 10-minute break is usually better than stepping away entirely. Is there something tiny you could still knock out before resting?";
    }

    if (/(?:motivat|encourage|push me|hype me|remind me why)/i.test(lower)) {
      if (activeTasks.length > 0) {
        return `Every step you complete on "${activeTasks[0].title}" is a real thing you did. You're building real momentum. What's the smallest possible next action?`;
      }
      return "You showed up, and that counts for more than you think. What's one small thing you could get done in the next 15 minutes?";
    }

    // ── GREETINGS ─────────────────────────────────────────────

    if (/^(?:hi|hey|hello|what's up|sup|yo|howdy|good morning|good afternoon|good evening)/i.test(lower)) {
      const name = studentName ? ` ${studentName.split(' ')[0]}` : '';
      if (activeTasks.length > 0) {
        return `Hey${name}! You've got ${activeTasks.length} active task${activeTasks.length > 1 ? 's' : ''} going: ${activeTasks.slice(0, 2).map((t) => `"${t.title}"`).join(', ')}. What would you like to work on?`;
      }
      return `Hey${name}! I'm Sid, your study companion. I can help you manage tasks, talk through what's making something hard, or just cheer you on. What's going on?`;
    }

    // ── CAPABILITY QUESTIONS ──────────────────────────────────

    if (/(?:what can you|what do you|how do you|help me|what are you)/i.test(lower)) {
      return "I can update your tasks (complete, pause, activate, or queue them), talk through procrastination, help you figure out your next step, and give you a push when you need one. Just tell me what you need.";
    }

    // ── GENERAL KNOWLEDGE QUESTIONS ──────────────────────────
    // Mock can't answer factual/general questions. Be honest and redirect.

    if (/^(?:what (?:is|are|was|were)|how (?:does|do|did)|why (?:is|are|does|do)|explain |can you (?:explain|tell me|describe))/i.test(lower) && !/task/i.test(lower)) {
      return "I'm Sid in built-in mode — I can manage your tasks but can't answer general questions. To chat freely, add a free DeepSeek or Anthropic API key in Settings → AI Provider.";
    }

    // ── GENERIC CONTEXTUAL RESPONSE ───────────────────────────

    if (activeTasks.length > 0) {
      const task = activeTasks[0];
      const contextuals = [
        `What's the one thing blocking you from moving forward on "${task.title}" right now?`,
        `For "${task.title}" — if you only had 10 minutes, what's the one thing you'd do?`,
        `I hear you. What would make working on "${task.title}" feel more manageable today?`,
        `You've got this. What's been the hardest part of "${task.title}" so far?`,
      ];
      return contextuals[messages.length % contextuals.length];
    }

    const generic = [
      "Tell me more — what's going on right now?",
      "I'm here. What would make things easier today?",
      "What's the thing weighing on you most right now?",
      "Let's figure this out. What are you working on?",
    ];
    return generic[messages.length % generic.length];
  }

  private parseTasks(ctx: string): TaskEntry[] {
    try {
      const match = ctx.match(/TASK_DATA:(.+?)(?:\n|$)/);
      if (match) return JSON.parse(match[1]) as TaskEntry[];
    } catch {}
    return [];
  }

  private parseField(ctx: string, field: string): string {
    const match = ctx.match(new RegExp(`${field}: (.+?)(?:\\n|$)`));
    return match ? match[1].trim() : '';
  }

  private findTask(tasks: TaskEntry[], name: string): TaskEntry | null {
    const lower = name.toLowerCase().trim();
    return (
      tasks.find((t) => t.title.toLowerCase() === lower) ??
      tasks.find((t) => t.title.toLowerCase().includes(lower) || lower.includes(t.title.toLowerCase().substring(0, 8))) ??
      null
    );
  }
}
