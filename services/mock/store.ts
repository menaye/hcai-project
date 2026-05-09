/**
 * In-memory mock data store
 *
 * Replaces Firebase Firestore + Auth when running without credentials.
 * Data persists for the lifetime of the JS session (resets on reload).
 *
 * Pre-populated with sample data so the app looks alive on first launch.
 */

import type { UserProfile, Task, StreakData } from '../../types';
import { todayString } from '../../utils/dateUtils';

// ── Mock user ─────────────────────────────────────────────────

export const MOCK_UID = 'mock-user-demo';

export const MOCK_USER_PROFILE: UserProfile = {
  uid: MOCK_UID,
  displayName: 'Demo Student',
  email: 'demo@jhu.edu',
  createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1 week ago
  onboardingComplete: true,
  context: 'Junior studying Computer Science, tends to put off writing assignments',
};

/** Minimal Firebase User-like object for the auth store */
export const MOCK_FIREBASE_USER = {
  uid: MOCK_UID,
  email: MOCK_USER_PROFILE.email,
  displayName: MOCK_USER_PROFILE.displayName,
  isAnonymous: false,
  emailVerified: true,
} as any; // cast so it satisfies firebase/auth User shape

// ── Sample task data ──────────────────────────────────────────

const now = Date.now();
const SAMPLE_TASK_1: Task = {
  id: 'sample-task-1',
  userId: MOCK_UID,
  title: 'Literature review for systems paper',
  description: 'Need to read at least 8 papers and synthesize findings for the related work section',
  dueAt: now + 1000 * 60 * 60 * 24 * 3, // 3 days from now
  status: 'active',
  createdAt: now - 1000 * 60 * 60 * 2,
  updatedAt: now - 1000 * 60 * 60 * 2,
  aiContext: 'You\'ve done literature reviews before — the hard part is starting, not reading.',
  steps: [
    {
      id: 'sample-task-1-step-1',
      taskId: 'sample-task-1',
      order: 1,
      title: 'Open Google Scholar and search the core topic',
      detail: 'Search for "distributed systems fault tolerance" or your specific topic. Don\'t read yet — just collect 10 promising titles.',
      estimatedMinutes: 10,
      status: 'completed',
      completedAt: now - 1000 * 60 * 30,
    },
    {
      id: 'sample-task-1-step-2',
      taskId: 'sample-task-1',
      order: 2,
      title: 'Skim abstracts and pick 8 to read',
      detail: 'Read only abstracts. Star the ones most relevant to your angle. Aim for variety: foundational papers + recent work.',
      estimatedMinutes: 15,
      status: 'active',
    },
    {
      id: 'sample-task-1-step-3',
      taskId: 'sample-task-1',
      order: 3,
      title: 'Read and annotate the top 4 papers',
      detail: 'Focus on the methods and conclusions. Take one-line notes per paper: "This paper argues X using Y method."',
      estimatedMinutes: 40,
      status: 'pending',
    },
    {
      id: 'sample-task-1-step-4',
      taskId: 'sample-task-1',
      order: 4,
      title: 'Read the remaining 4 papers',
      detail: 'Same approach — one-line takeaways. Note where papers agree or conflict with each other.',
      estimatedMinutes: 40,
      status: 'pending',
    },
    {
      id: 'sample-task-1-step-5',
      taskId: 'sample-task-1',
      order: 5,
      title: 'Draft a 3-paragraph synthesis outline',
      detail: 'Don\'t write full sentences yet. Just: "Theme 1 — covered by papers A, B, C. Theme 2 — covered by D, E."',
      estimatedMinutes: 20,
      status: 'pending',
    },
  ],
};

const SAMPLE_TASK_2: Task = {
  id: 'sample-task-2',
  userId: MOCK_UID,
  title: 'Study for algorithms midterm',
  description: 'Covers greedy algorithms, dynamic programming, and graph traversal',
  dueAt: now + 1000 * 60 * 60 * 24 * 5,
  status: 'active',
  createdAt: now - 1000 * 60 * 60 * 24,
  updatedAt: now - 1000 * 60 * 60 * 24,
  aiContext: 'DP is hard for everyone at first. Start with the smallest examples.',
  steps: [
    {
      id: 'sample-task-2-step-1',
      taskId: 'sample-task-2',
      order: 1,
      title: 'Review lecture notes for greedy algorithms',
      detail: 'Skim your notes from lectures 8–10. Write down the 3 key greedy problems and their patterns.',
      estimatedMinutes: 20,
      status: 'active',
    },
    {
      id: 'sample-task-2-step-2',
      taskId: 'sample-task-2',
      order: 2,
      title: 'Solve 2 practice greedy problems',
      detail: 'Pick problems from the practice set. Do them on paper before checking solutions.',
      estimatedMinutes: 25,
      status: 'pending',
    },
    {
      id: 'sample-task-2-step-3',
      taskId: 'sample-task-2',
      order: 3,
      title: 'Review dynamic programming patterns',
      detail: 'Focus on the recurrence relation approach. Write out the DP table for fibonacci as warmup.',
      estimatedMinutes: 30,
      status: 'pending',
    },
    {
      id: 'sample-task-2-step-4',
      taskId: 'sample-task-2',
      order: 4,
      title: 'Solve 2 DP problems',
      detail: 'Start with coin change or knapsack. Draw the table before coding.',
      estimatedMinutes: 30,
      status: 'pending',
    },
  ],
};

const SAMPLE_TASK_3: Task = {
  id: 'sample-task-3',
  userId: MOCK_UID,
  title: 'Submit project proposal for HCAI course',
  description: 'Need to write a 2-page proposal covering problem statement, methods, and evaluation plan',
  status: 'completed',
  createdAt: now - 1000 * 60 * 60 * 24 * 5,
  updatedAt: now - 1000 * 60 * 60 * 24 * 3,
  completedAt: now - 1000 * 60 * 60 * 24 * 3,
  aiContext: 'Good job completing this — it was worth starting early.',
  steps: [
    { id: 'st3-1', taskId: 'sample-task-3', order: 1, title: 'Outline the problem statement', detail: '', estimatedMinutes: 15, status: 'completed', completedAt: now - 1000 * 60 * 60 * 24 * 4 },
    { id: 'st3-2', taskId: 'sample-task-3', order: 2, title: 'Draft related work section', detail: '', estimatedMinutes: 20, status: 'completed', completedAt: now - 1000 * 60 * 60 * 24 * 4 },
    { id: 'st3-3', taskId: 'sample-task-3', order: 3, title: 'Write evaluation plan', detail: '', estimatedMinutes: 15, status: 'completed', completedAt: now - 1000 * 60 * 60 * 24 * 3 },
    { id: 'st3-4', taskId: 'sample-task-3', order: 4, title: 'Proofread and submit', detail: '', estimatedMinutes: 10, status: 'completed', completedAt: now - 1000 * 60 * 60 * 24 * 3 },
  ],
};

// ── In-memory store ───────────────────────────────────────────

export const mockUsers: Record<string, UserProfile> = {
  [MOCK_UID]: MOCK_USER_PROFILE,
};

export const mockTasks: Record<string, Task> = {
  [SAMPLE_TASK_1.id]: SAMPLE_TASK_1,
  [SAMPLE_TASK_2.id]: SAMPLE_TASK_2,
  [SAMPLE_TASK_3.id]: SAMPLE_TASK_3,
};

export const mockStreaks: Record<string, StreakData> = {
  [MOCK_UID]: {
    userId: MOCK_UID,
    currentStreak: 3,
    longestStreak: 5,
    lastActiveDate: todayString(),
    totalTasksCompleted: 1,
    totalStepsCompleted: 1,
  },
};

// ── Subscriber registry (simulates onSnapshot) ────────────────

type Callback<T> = (data: T) => void;

interface Subscription<T> {
  id: string;
  callback: Callback<T>;
}

class SubscriberMap<T> {
  private map: Record<string, Subscription<T>[]> = {};

  subscribe(key: string, callback: Callback<T>): () => void {
    const id = Math.random().toString(36).slice(2);
    if (!this.map[key]) this.map[key] = [];
    this.map[key].push({ id, callback });
    return () => {
      this.map[key] = (this.map[key] ?? []).filter((s) => s.id !== id);
    };
  }

  notify(key: string, data: T) {
    (this.map[key] ?? []).forEach((s) => s.callback(data));
  }
}

export const taskSubscribers = new SubscriberMap<Task[]>();
export const streakSubscribers = new SubscriberMap<StreakData>();
export const authSubscribers: Callback<any>[] = [];

/** Notify all task subscribers for a user — sorted newest-updated first */
export function notifyTaskSubscribers(uid: string) {
  const tasks = Object.values(mockTasks)
    .filter((t) => t.userId === uid)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  taskSubscribers.notify(uid, tasks);
}

/** Notify all streak subscribers for a user */
export function notifyStreakSubscribers(uid: string) {
  const streak = mockStreaks[uid];
  if (streak) streakSubscribers.notify(uid, streak);
}
