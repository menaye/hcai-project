/**
 * useTasks – subscribes to Firestore tasks and syncs to Zustand store
 */

import { useEffect } from 'react';
import { subscribeToAllTasks, subscribeToStreak } from '../services/firebase/firestore';
import { useTaskStore } from '../store/taskStore';
import { useAuthStore } from '../store/authStore';

export function useTasks() {
  const uid = useAuthStore((s) => s.user?.uid);
  const { setTasks, setStreak } = useTaskStore();

  useEffect(() => {
    if (!uid) return;

    const unsubTasks = subscribeToAllTasks(uid, setTasks);
    const unsubStreak = subscribeToStreak(uid, setStreak);

    return () => {
      unsubTasks();
      unsubStreak();
    };
  }, [uid]);
}

export function useTaskList() {
  return useTaskStore((s) => ({
    tasks: s.tasks,
    activeTasks: s.tasks.filter((t) => t.status === 'active'),
    completedTasks: s.tasks.filter((t) => t.status === 'completed'),
    streak: s.streak,
  }));
}
