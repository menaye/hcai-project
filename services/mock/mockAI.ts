/**
 * Mock AI responses — used when EXPO_PUBLIC_ANTHROPIC_API_KEY is absent.
 * Returns realistic-looking task decompositions with a simulated delay.
 */

import type { AITaskBreakdown } from '../../types';

/** Simulated network delay */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Generate a plausible mock breakdown for any task title */
export async function mockDecomposeTask(title: string): Promise<AITaskBreakdown> {
  await delay(1800); // feel like it's thinking

  return {
    steps: [
      {
        title: `Open a blank document for "${title.slice(0, 40)}"`,
        detail: `Start with the lowest-friction action: open a new document and type the title at the top. That's it — just that one thing.`,
        estimatedMinutes: 5,
      },
      {
        title: 'Write a rough 5-point outline',
        detail: 'Spend exactly 10 minutes jotting down the main sections or questions. They don\'t need to be good — just get something on the page.',
        estimatedMinutes: 10,
      },
      {
        title: 'Gather your primary sources or materials',
        detail: 'Find the 3–5 most important references, readings, or materials you need. Open tabs, download PDFs, or collect your notes.',
        estimatedMinutes: 15,
      },
      {
        title: 'Draft the easiest section first',
        detail: 'Pick whichever section feels most concrete and write a rough first draft. Imperfect is fine — you\'re building momentum.',
        estimatedMinutes: 25,
      },
      {
        title: 'Fill in the remaining sections',
        detail: 'Now that you\'re warmed up, work through the other sections. Keep moving — don\'t get stuck polishing early sections.',
        estimatedMinutes: 30,
      },
      {
        title: 'Review, tighten, and finalize',
        detail: 'Read it through once for clarity. Fix the obvious rough spots. Then stop — done is better than perfect.',
        estimatedMinutes: 15,
      },
    ],
    firstStepGuidance: `Open a blank document right now and type the title. That single action is your first step — it takes 30 seconds.`,
    motivationalNote: `This might feel like a lot, but you only need to start the first step. The rest gets easier once you're moving.`,
  };
}

export async function mockRegenerateStep(stepTitle: string) {
  await delay(800);
  return {
    title: `Try a different approach to: ${stepTitle.slice(0, 50)}`,
    detail: 'Break this into an even smaller chunk — do just the first 5 minutes of it, then reassess.',
    estimatedMinutes: 10,
  };
}

export async function mockGetEncouragement(completedStep: string, stepsLeft: number): Promise<string> {
  await delay(400);
  const messages = [
    `Solid — ${stepsLeft} step${stepsLeft !== 1 ? 's' : ''} left and you're already moving.`,
    `That one's done. Keep the momentum going.`,
    `One down. ${stepsLeft} to go — you've got this.`,
    `Progress. That step is behind you now.`,
    `Done. That took real effort — ${stepsLeft} more to go.`,
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
