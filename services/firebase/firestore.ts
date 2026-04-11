/**
 * Firestore data access layer
 *
 * Collections:
 *  users/{uid}                     – UserProfile
 *  users/{uid}/tasks/{taskId}      – Task
 *  users/{uid}/streaks/current     – StreakData
 *
 * All writes use merge-safe patterns to avoid clobbering partial updates.
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './config';
import type { UserProfile, Task, TaskStep, StreakData } from '../../types';
import { todayString } from '../../utils/dateUtils';

// ── Collection helpers ────────────────────────────────────────

const usersCol = () => collection(db, 'users');
const userDoc = (uid: string) => doc(db, 'users', uid);
const tasksCol = (uid: string) => collection(db, 'users', uid, 'tasks');
const taskDoc = (uid: string, taskId: string) => doc(db, 'users', uid, 'tasks', taskId);
const streakDoc = (uid: string) => doc(db, 'users', uid, 'streaks', 'current');

// ── User Profile ──────────────────────────────────────────────

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(userDoc(profile.uid), profile, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDoc(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<UserProfile>,
): Promise<void> {
  await updateDoc(userDoc(uid), updates);
}

// ── Tasks ─────────────────────────────────────────────────────

export async function createTask(task: Task): Promise<void> {
  await setDoc(taskDoc(task.userId, task.id), task);
}

export async function getTask(uid: string, taskId: string): Promise<Task | null> {
  const snap = await getDoc(taskDoc(uid, taskId));
  return snap.exists() ? (snap.data() as Task) : null;
}

export async function updateTask(
  uid: string,
  taskId: string,
  updates: Partial<Task>,
): Promise<void> {
  await updateDoc(taskDoc(uid, taskId), { ...updates, updatedAt: Date.now() });
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  await deleteDoc(taskDoc(uid, taskId));
}

export async function getActiveTasks(uid: string): Promise<Task[]> {
  const q = query(tasksCol(uid), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Task);
}

export async function getRecentTasks(uid: string, count = 10): Promise<Task[]> {
  const q = query(tasksCol(uid), orderBy('createdAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Task);
}

export function subscribeToActiveTasks(
  uid: string,
  callback: (tasks: Task[]) => void,
): Unsubscribe {
  const q = query(tasksCol(uid), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Task));
  });
}

export function subscribeToAllTasks(
  uid: string,
  callback: (tasks: Task[]) => void,
): Unsubscribe {
  const q = query(tasksCol(uid), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Task));
  });
}

/** Update a single step within a task */
export async function updateTaskStep(
  uid: string,
  taskId: string,
  stepId: string,
  stepUpdate: Partial<TaskStep>,
): Promise<void> {
  const task = await getTask(uid, taskId);
  if (!task) return;
  const steps = task.steps.map((s) =>
    s.id === stepId ? { ...s, ...stepUpdate } : s,
  );
  const allComplete = steps.every((s) => s.status === 'completed' || s.status === 'skipped');
  await updateDoc(taskDoc(uid, taskId), {
    steps,
    status: allComplete ? 'completed' : 'active',
    updatedAt: Date.now(),
    ...(allComplete ? { completedAt: Date.now() } : {}),
  });
}

// ── Streaks ───────────────────────────────────────────────────

const defaultStreak = (uid: string): StreakData => ({
  userId: uid,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  totalTasksCompleted: 0,
  totalStepsCompleted: 0,
});

export async function getStreakData(uid: string): Promise<StreakData> {
  const snap = await getDoc(streakDoc(uid));
  return snap.exists() ? (snap.data() as StreakData) : defaultStreak(uid);
}

export async function recordActivity(uid: string, type: 'task' | 'step'): Promise<StreakData> {
  const streak = await getStreakData(uid);
  const today = todayString();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  let newCurrent = streak.currentStreak;
  if (streak.lastActiveDate === today) {
    // Already active today – just increment counts
  } else if (streak.lastActiveDate === yesterday) {
    newCurrent += 1;
  } else {
    newCurrent = 1; // streak broken
  }

  const updated: StreakData = {
    ...streak,
    currentStreak: newCurrent,
    longestStreak: Math.max(streak.longestStreak, newCurrent),
    lastActiveDate: today,
    totalTasksCompleted: streak.totalTasksCompleted + (type === 'task' ? 1 : 0),
    totalStepsCompleted: streak.totalStepsCompleted + (type === 'step' ? 1 : 0),
  };

  await setDoc(streakDoc(uid), updated, { merge: true });
  return updated;
}

export function subscribeToStreak(
  uid: string,
  callback: (streak: StreakData) => void,
): Unsubscribe {
  return onSnapshot(streakDoc(uid), (snap) => {
    callback(snap.exists() ? (snap.data() as StreakData) : defaultStreak(uid));
  });
}
