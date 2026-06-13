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
  resetKey: unknown
) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());

  // Reset when resetKey changes
  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
  }, [resetKey]);

  useEffect(() => {
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(secs);
    }, 500);
    return () => clearInterval(interval);
  }, [resetKey]);

  if (mode === 'stopwatch') {
    return { elapsed, remaining: null, isExpired: false };
  }

  // timer mode
  const remaining = Math.max(0, limitSecs - elapsed);
  const isExpired = remaining === 0;

  return { elapsed, remaining, isExpired };
}
