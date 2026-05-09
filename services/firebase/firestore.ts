/**
 * Firestore data access layer — with mock fallback
 *
 * When MOCK_MODE is active, all reads/writes go to the in-memory store
 * in services/mock/store.ts. Listeners (onSnapshot equivalents) fire
 * immediately with current data and again on any write.
 */

import { MOCK_MODE } from './config';
import type { UserProfile, Task, TaskStep, StreakData } from '../../types';
import { todayString } from '../../utils/dateUtils';
import {
  mockUsers,
  mockTasks,
  mockStreaks,
  MOCK_UID,
  taskSubscribers,
  streakSubscribers,
  notifyTaskSubscribers,
  notifyStreakSubscribers,
} from '../mock/store';

// ── Mock implementations ──────────────────────────────────────

// -- User Profile --

function mockCreateUserProfile(profile: UserProfile): Promise<void> {
  mockUsers[profile.uid] = profile;
  return Promise.resolve();
}

function mockGetUserProfile(uid: string): Promise<UserProfile | null> {
  return Promise.resolve(mockUsers[uid] ?? null);
}

function mockUpdateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  if (mockUsers[uid]) {
    mockUsers[uid] = { ...mockUsers[uid], ...updates };
  }
  return Promise.resolve();
}

// -- Tasks --

function mockCreateTask(task: Task): Promise<void> {
  mockTasks[task.id] = task;
  notifyTaskSubscribers(task.userId);
  return Promise.resolve();
}

function mockGetTask(uid: string, taskId: string): Promise<Task | null> {
  const task = mockTasks[taskId];
  return Promise.resolve(task?.userId === uid ? task : null);
}

function mockUpdateTask(uid: string, taskId: string, updates: Partial<Task>): Promise<void> {
  const task = mockTasks[taskId];
  if (task?.userId === uid) {
    mockTasks[taskId] = { ...task, ...updates, updatedAt: Date.now() };
    notifyTaskSubscribers(uid);
  }
  return Promise.resolve();
}

function mockDeleteTask(uid: string, taskId: string): Promise<void> {
  if (mockTasks[taskId]?.userId === uid) {
    delete mockTasks[taskId];
    notifyTaskSubscribers(uid);
  }
  return Promise.resolve();
}

function mockGetActiveTasks(uid: string): Promise<Task[]> {
  const tasks = Object.values(mockTasks)
    .filter((t) => t.userId === uid && t.status === 'active')
    .sort((a, b) => b.createdAt - a.createdAt);
  return Promise.resolve(tasks);
}

function mockGetRecentTasks(uid: string, count: number): Promise<Task[]> {
  const tasks = Object.values(mockTasks)
    .filter((t) => t.userId === uid)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, count);
  return Promise.resolve(tasks);
}

function mockSubscribeToAllTasks(uid: string, callback: (tasks: Task[]) => void): () => void {
  const tasks = Object.values(mockTasks)
    .filter((t) => t.userId === uid)
    .sort((a, b) => b.createdAt - a.createdAt);
  // Fire immediately with current data
  setTimeout(() => callback(tasks), 0);
  return taskSubscribers.subscribe(uid, callback);
}

function mockUpdateTaskStep(
  uid: string,
  taskId: string,
  stepId: string,
  stepUpdate: Partial<TaskStep>,
): Promise<void> {
  const task = mockTasks[taskId];
  if (!task || task.userId !== uid) return Promise.resolve();

  const steps = task.steps.map((s) =>
    s.id === stepId ? { ...s, ...stepUpdate } : s,
  );
  const allComplete = steps.every(
    (s) => s.status === 'completed' || s.status === 'skipped',
  );

  mockTasks[taskId] = {
    ...task,
    steps,
    status: allComplete ? 'completed' : 'active',
    updatedAt: Date.now(),
    completedAt: allComplete ? Date.now() : undefined,
  };
  notifyTaskSubscribers(uid);
  return Promise.resolve();
}

// -- Streaks --

const defaultStreak = (uid: string): StreakData => ({
  userId: uid,
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: '',
  totalTasksCompleted: 0,
  totalStepsCompleted: 0,
});

function mockGetStreakData(uid: string): Promise<StreakData> {
  return Promise.resolve(mockStreaks[uid] ?? defaultStreak(uid));
}

async function mockRecordActivity(uid: string, type: 'task' | 'step'): Promise<StreakData> {
  const streak = await mockGetStreakData(uid);
  const today = todayString();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();

  let newCurrent = streak.currentStreak;
  if (streak.lastActiveDate === today) {
    // Already active today
  } else if (streak.lastActiveDate === yesterday) {
    newCurrent += 1;
  } else {
    newCurrent = 1;
  }

  const updated: StreakData = {
    ...streak,
    currentStreak: newCurrent,
    longestStreak: Math.max(streak.longestStreak, newCurrent),
    lastActiveDate: today,
    totalTasksCompleted: streak.totalTasksCompleted + (type === 'task' ? 1 : 0),
    totalStepsCompleted: streak.totalStepsCompleted + (type === 'step' ? 1 : 0),
  };
  mockStreaks[uid] = updated;
  notifyStreakSubscribers(uid);
  return updated;
}

function mockSubscribeToStreak(uid: string, callback: (streak: StreakData) => void): () => void {
  const streak = mockStreaks[uid] ?? defaultStreak(uid);
  setTimeout(() => callback(streak), 0);
  return streakSubscribers.subscribe(uid, callback);
}

// ── Real Firestore helpers (lazy) ──────────────────────────────

async function getFS() {
  const fs = await import('firebase/firestore');
  const { db } = await import('./config');
  return { ...fs, db };
}

// ── Exported API ──────────────────────────────────────────────

export async function createUserProfile(profile: UserProfile): Promise<void> {
  if (MOCK_MODE) return mockCreateUserProfile(profile);
  const { setDoc, doc, db } = await getFS();
  await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (MOCK_MODE) return mockGetUserProfile(uid);
  const { getDoc, doc, db } = await getFS();
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  if (MOCK_MODE) return mockUpdateUserProfile(uid, updates);
  const { updateDoc, doc, db } = await getFS();
  await updateDoc(doc(db, 'users', uid), updates);
}

export async function createTask(task: Task): Promise<void> {
  if (MOCK_MODE) return mockCreateTask(task);
  const { setDoc, doc, db } = await getFS();
  await setDoc(doc(db, 'users', task.userId, 'tasks', task.id), task);
}

export async function getTask(uid: string, taskId: string): Promise<Task | null> {
  if (MOCK_MODE) return mockGetTask(uid, taskId);
  const { getDoc, doc, db } = await getFS();
  const snap = await getDoc(doc(db, 'users', uid, 'tasks', taskId));
  return snap.exists() ? (snap.data() as Task) : null;
}

export async function updateTask(uid: string, taskId: string, updates: Partial<Task>): Promise<void> {
  if (MOCK_MODE) return mockUpdateTask(uid, taskId, updates);
  const { updateDoc, doc, db } = await getFS();
  await updateDoc(doc(db, 'users', uid, 'tasks', taskId), { ...updates, updatedAt: Date.now() });
}

export async function deleteTask(uid: string, taskId: string): Promise<void> {
  if (MOCK_MODE) return mockDeleteTask(uid, taskId);
  const { deleteDoc, doc, db } = await getFS();
  await deleteDoc(doc(db, 'users', uid, 'tasks', taskId));
}

export async function getActiveTasks(uid: string): Promise<Task[]> {
  if (MOCK_MODE) return mockGetActiveTasks(uid);
  const { collection, query, where, orderBy, getDocs, db } = await getFS();
  const q = query(
    collection(db, 'users', uid, 'tasks'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Task);
}

export async function getRecentTasks(uid: string, count = 10): Promise<Task[]> {
  if (MOCK_MODE) return mockGetRecentTasks(uid, count);
  const { collection, query, orderBy, limit, getDocs, db } = await getFS();
  const q = query(
    collection(db, 'users', uid, 'tasks'),
    orderBy('createdAt', 'desc'),
    limit(count),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Task);
}

export function subscribeToAllTasks(uid: string, callback: (tasks: Task[]) => void): () => void {
  if (MOCK_MODE) return mockSubscribeToAllTasks(uid, callback);
  let unsubscribe: (() => void) | null = null;
  getFS().then(({ collection, query, orderBy, limit, onSnapshot, db }) => {
    const q = query(
      collection(db, 'users', uid, 'tasks'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    unsubscribe = onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => d.data() as Task));
    });
  });
  return () => unsubscribe?.();
}

export async function updateTaskStep(
  uid: string,
  taskId: string,
  stepId: string,
  stepUpdate: Partial<TaskStep>,
): Promise<void> {
  if (MOCK_MODE) return mockUpdateTaskStep(uid, taskId, stepId, stepUpdate);
  const { updateDoc, doc, db } = await getFS();
  const task = await getTask(uid, taskId);
  if (!task) return;
  const steps = task.steps.map((s) => (s.id === stepId ? { ...s, ...stepUpdate } : s));
  const allComplete = steps.every((s) => s.status === 'completed' || s.status === 'skipped');
  await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
    steps,
    status: allComplete ? 'completed' : 'active',
    updatedAt: Date.now(),
    completedAt: allComplete ? Date.now() : null,
  });
}

export async function getStreakData(uid: string): Promise<StreakData> {
  if (MOCK_MODE) return mockGetStreakData(uid);
  const { getDoc, doc, db } = await getFS();
  const snap = await getDoc(doc(db, 'users', uid, 'streaks', 'current'));
  return snap.exists() ? (snap.data() as StreakData) : defaultStreak(uid);
}

export async function recordActivity(uid: string, type: 'task' | 'step'): Promise<StreakData> {
  if (MOCK_MODE) return mockRecordActivity(uid, type);
  const streak = await getStreakData(uid);
  const today = todayString();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  })();
  let newCurrent = streak.currentStreak;
  if (streak.lastActiveDate !== today) {
    newCurrent = streak.lastActiveDate === yesterday ? newCurrent + 1 : 1;
  }
  const updated: StreakData = {
    ...streak,
    currentStreak: newCurrent,
    longestStreak: Math.max(streak.longestStreak, newCurrent),
    lastActiveDate: today,
    totalTasksCompleted: streak.totalTasksCompleted + (type === 'task' ? 1 : 0),
    totalStepsCompleted: streak.totalStepsCompleted + (type === 'step' ? 1 : 0),
  };
  const { setDoc, doc, db } = await getFS();
  await setDoc(doc(db, 'users', uid, 'streaks', 'current'), updated, { merge: true });
  return updated;
}

export function subscribeToStreak(uid: string, callback: (streak: StreakData) => void): () => void {
  if (MOCK_MODE) return mockSubscribeToStreak(uid, callback);
  let unsubscribe: (() => void) | null = null;
  getFS().then(({ onSnapshot, doc, db }) => {
    unsubscribe = onSnapshot(doc(db, 'users', uid, 'streaks', 'current'), (snap) => {
      callback(snap.exists() ? (snap.data() as StreakData) : defaultStreak(uid));
    });
  });
  return () => unsubscribe?.();
}
