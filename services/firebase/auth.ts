/**
 * Firebase Auth service — with mock fallback
 *
 * When MOCK_MODE is active (no Firebase credentials configured), all auth
 * operations are handled in-memory. The app auto-signs in as "Demo Student"
 * so the full UI is explorable without any backend.
 */

import type { User } from 'firebase/auth';
import { MOCK_MODE } from './config';
import {
  MOCK_FIREBASE_USER,
  MOCK_UID,
  MOCK_USER_PROFILE,
  mockUsers,
  authSubscribers,
} from '../mock/store';

// ── Mock implementations ──────────────────────────────────────

let _mockCurrentUser: any = null;
let _authCallbacks: ((user: any) => void)[] = [];

function _notifyAuthCallbacks(user: any) {
  _authCallbacks.forEach((cb) => cb(user));
}

async function mockSignIn(displayName?: string): Promise<any> {
  _mockCurrentUser = { ...MOCK_FIREBASE_USER, displayName: displayName ?? MOCK_FIREBASE_USER.displayName };
  _notifyAuthCallbacks(_mockCurrentUser);
  return _mockCurrentUser;
}

function mockSubscribeToAuthState(callback: (user: any) => void): () => void {
  _authCallbacks.push(callback);
  // Auto sign-in as Demo Student after a short delay (simulates async init)
  setTimeout(() => {
    _mockCurrentUser = MOCK_FIREBASE_USER;
    callback(_mockCurrentUser);
  }, 300);
  return () => {
    _authCallbacks = _authCallbacks.filter((cb) => cb !== callback);
  };
}

async function mockSignOut(): Promise<void> {
  _mockCurrentUser = null;
  _notifyAuthCallbacks(null);
}

// ── Real Firebase implementations (lazy import) ───────────────

async function getRealAuth() {
  const {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInAnonymously,
    signOut: fbSignOut,
    updateProfile,
    onAuthStateChanged,
  } = await import('firebase/auth');
  const { auth } = await import('./config');
  return {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInAnonymously,
    fbSignOut,
    updateProfile,
    onAuthStateChanged,
    auth,
  };
}

// ── Exported API (same interface regardless of mode) ──────────

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<any> {
  if (MOCK_MODE) {
    return mockSignIn(displayName);
  }
  const { createUserWithEmailAndPassword, updateProfile, auth } = await getRealAuth();
  const { createUserProfile } = await import('./firestore');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  await createUserProfile({
    uid: credential.user.uid,
    displayName,
    email,
    createdAt: Date.now(),
    onboardingComplete: false,
  });
  return credential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<any> {
  if (MOCK_MODE) return mockSignIn();
  const { signInWithEmailAndPassword, auth } = await getRealAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInAsGuest(): Promise<any> {
  if (MOCK_MODE) return mockSignIn('Guest');
  const { signInAnonymously, auth } = await getRealAuth();
  const { createUserProfile } = await import('./firestore');
  const credential = await signInAnonymously(auth);
  await createUserProfile({
    uid: credential.user.uid,
    displayName: 'Student',
    createdAt: Date.now(),
    onboardingComplete: false,
  });
  return credential.user;
}

export async function signOut(): Promise<void> {
  if (MOCK_MODE) {
    await mockSignOut();
    return;
  }
  const { fbSignOut, auth } = await getRealAuth();
  await fbSignOut(auth);
}

export function subscribeToAuthState(callback: (user: any | null) => void): () => void {
  if (MOCK_MODE) {
    return mockSubscribeToAuthState(callback);
  }
  // Real Firebase — synchronous setup
  let unsubscribe: (() => void) | null = null;
  import('firebase/auth').then(({ onAuthStateChanged }) => {
    import('./config').then(({ auth }) => {
      unsubscribe = onAuthStateChanged(auth, callback);
    });
  });
  return () => unsubscribe?.();
}

export { MOCK_MODE };
