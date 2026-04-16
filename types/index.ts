// ──────────────────────────────────────────────────────────────
//  Human.exe – Core TypeScript Types
// ──────────────────────────────────────────────────────────────

// ── User ──────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  createdAt: number;
  onboardingComplete: boolean;
  /** User-defined context about themselves (major, year, etc.) */
  context?: string;
}

// ── Task / Assignment ─────────────────────────────────────────

export type TaskStatus = 'active' | 'completed' | 'abandoned' | 'inactive' | 'queued';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  userId: string;
  title: string;
  /** Raw description the user typed */
  description: string;
  /** Official deadline epoch ms */
  dueAt?: number;
  /** User-set personal target date (before the official deadline) */
  targetDate?: number;
  /** Priority level */
  priority?: TaskPriority;
  /** Self-reward or consequence the user defined */
  reward?: string;
  status: TaskStatus;
  steps: TaskStep[];
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  /** AI-generated motivational context for this task */
  aiContext?: string;
}

export type StepStatus = 'pending' | 'active' | 'completed' | 'skipped';

export interface TaskStep {
  id: string;
  taskId: string;
  order: number;
  title: string;
  /** Detailed guidance for completing this step */
  detail?: string;
  /** Estimated duration in minutes */
  estimatedMinutes?: number;
  status: StepStatus;
  completedAt?: number;
}

// ── Session (a focused work period) ──────────────────────────

export interface WorkSession {
  id: string;
  userId: string;
  taskId: string;
  stepId?: string;
  startedAt: number;
  endedAt?: number;
  /** Duration in seconds */
  durationSeconds?: number;
}

// ── Streak ────────────────────────────────────────────────────

export interface StreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // 'YYYY-MM-DD'
  totalTasksCompleted: number;
  totalStepsCompleted: number;
}

// ── AI ────────────────────────────────────────────────────────

export interface AITaskBreakdown {
  steps: {
    title: string;
    detail: string;
    estimatedMinutes: number;
  }[];
  firstStepGuidance: string;
  motivationalNote: string;
}

export interface AIFirstStepResponse {
  firstStep: string;
  encouragement: string;
}

// ── Navigation ────────────────────────────────────────────────

export type RootStackParamList = {
  '(auth)/welcome': undefined;
  '(auth)/onboarding': undefined;
  '(tabs)': undefined;
  'task/new': undefined;
  'task/[id]': { id: string };
};

// ── UI State ──────────────────────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
