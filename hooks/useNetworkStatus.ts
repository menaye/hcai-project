import { useState, useEffect, useRef } from 'react';
import { MOCK_MODE } from '../services/firebase/config';

/**
 * Returns true when the device can reach the internet.
 * Always returns true in MOCK_MODE (no backend to check).
 * Polls every 15 seconds using a lightweight HTTP HEAD request.
 */
export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = async () => {
    if (MOCK_MODE) return;
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);
      await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });
      clearTimeout(id);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    }
  };

  useEffect(() => {
    if (MOCK_MODE) return;
    check();
    intervalRef.current = setInterval(check, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return isOnline;
}
