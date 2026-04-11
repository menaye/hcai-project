/**
 * useAuth – subscribes to Firebase auth state and syncs to Zustand store
 */

import { useEffect } from 'react';
import { subscribeToAuthState } from '../services/firebase/auth';
import { getUserProfile } from '../services/firebase/firestore';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { setUser, setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAuthState(async (user) => {
      setUser(user);
      if (user) {
        const profile = await getUserProfile(user.uid);
        setProfile(profile);
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);
}

export function useCurrentUser() {
  return useAuthStore((s) => ({
    user: s.user,
    profile: s.profile,
    isAuthenticated: s.isAuthenticated,
    isLoading: s.isLoading,
  }));
}
