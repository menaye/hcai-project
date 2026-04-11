/**
 * Firebase Auth service
 *
 * Supports:
 *  - Email/password sign-up and sign-in
 *  - Anonymous sign-in (guest mode)
 *  - Sign-out
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './config';
import { createUserProfile } from './firestore';

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
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

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInAsGuest(): Promise<User> {
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
  await firebaseSignOut(auth);
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { auth };
