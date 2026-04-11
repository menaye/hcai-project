/**
 * Task store
 * Zustand slice for tasks, steps, streaks, and AI loading state
 */

import { create } from 'zustand';
import type { Task, StreakData, LoadingState } from '../types';

interface TaskState {
  tasks: Task[];
  streak: StreakData | null;
  aiLoadingState: LoadingState;
  aiError: string | null;
  activeTaskId: string | null;

  // Setters
  setTasks: (tasks: Task[]) => void;
  upsertTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  setStreak: (streak: StreakData) => void;
  setAiLoadingState: (state: LoadingState) => void;
  setAiError: (error: string | null) => void;
  setActiveTaskId: (id: string | null) => void;

  // Computed helpers
  getActiveTask: () => Task | undefined;
  getCompletedTasks: () => Task[];
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  streak: null,
  aiLoadingState: 'idle',
  aiError: null,
  activeTaskId: null,

  setTasks: (tasks) => set({ tasks }),

  upsertTask: (task) =>
    set((state) => {
      const idx = state.tasks.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        const tasks = [...state.tasks];
        tasks[idx] = task;
        return { tasks };
      }
      return { tasks: [task, ...state.tasks] };
    }),

  removeTask: (taskId) =>
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== taskId) })),

  setStreak: (streak) => set({ streak }),

  setAiLoadingState: (aiLoadingState) => set({ aiLoadingState }),

  setAiError: (aiError) => set({ aiError }),

  setActiveTaskId: (activeTaskId) => set({ activeTaskId }),

  getActiveTask: () => {
    const { tasks, activeTaskId } = get();
    if (activeTaskId) return tasks.find((t) => t.id === activeTaskId);
    return tasks.find((t) => t.status === 'active');
  },

  getCompletedTasks: () => get().tasks.filter((t) => t.status === 'completed'),
}));
