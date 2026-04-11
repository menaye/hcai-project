/**
 * Firebase configuration
 *
 * MOCK_MODE is active when EXPO_PUBLIC_FIREBASE_API_KEY is absent or set to 'mock'.
 * In mock mode, Firebase is never initialized — all operations are handled by
 * the in-memory mock layer in services/mock/. This lets the app run fully
 * without any credentials configured.
 *
 * To connect real Firebase: copy .env.example → .env and fill in values.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

/** True when running without real Firebase credentials */
export const MOCK_MODE = !apiKey || apiKey === 'mock' || apiKey === 'your_firebase_api_key';

let _app: FirebaseApp | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;

if (!MOCK_MODE) {
  const firebaseConfig = {
    apiKey,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  _db = getFirestore(_app);
  _auth = getAuth(_app);
}

export const db = _db as Firestore;
export const auth = _auth as Auth;
export default _app as FirebaseApp;
