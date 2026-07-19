import { useState, useEffect, useRef } from 'react';

/**
 * Reusable timer hook.
 *
 * mode = 'timer'     → counts DOWN from limitSecs. isExpired becomes true when remaining hits 0.
 * mode = 'stopwatch' → counts UP. remaining is always null. isExpired is always false.
 *
 * The timer resets whenever `resetKey` changes.
 */
export function useTimer(
  mode: 'timer' | 'stopwatch',
  limitSecs: number = 30,
  resetKey: unknown,
  isPaused: boolean = false
) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());
  const pausedTimeRef = useRef<number>(0);
  const pauseStartedAtRef = useRef<number | null>(null);

  // Reset when resetKey changes
  useEffect(() => {
    startRef.current = Date.now();
    pausedTimeRef.current = 0;
    pauseStartedAtRef.current = null;
    setElapsed(0);
  }, [resetKey]);

  // Handle pause / unpause transition
  useEffect(() => {
    if (isPaused) {
      if (!pauseStartedAtRef.current) {
        pauseStartedAtRef.current = Date.now();
      }
    } else {
      if (pauseStartedAtRef.current) {
        pausedTimeRef.current += (Date.now() - pauseStartedAtRef.current);
        pauseStartedAtRef.current = null;
      }
    }
  }, [isPaused]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const activeMs = Date.now() - startRef.current - pausedTimeRef.current;
      const secs = Math.floor(activeMs / 1000);
      setElapsed(secs);
    }, 500);
    return () => clearInterval(interval);
  }, [resetKey, isPaused]);

  if (mode === 'stopwatch') {
    return { elapsed, remaining: null, isExpired: false };
  }

  // timer mode
  const remaining = Math.max(0, limitSecs - elapsed);
  const isExpired = remaining === 0;

  return { elapsed, remaining, isExpired };
}
