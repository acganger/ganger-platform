import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook that throttles a value, only updating at most once per throttle period
 * @param value The value to throttle
 * @param delay The throttle delay in milliseconds
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= delay) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, delay - (Date.now() - lastRun.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return throttledValue;
}

/**
 * Hook that returns a throttled callback function
 * @param callback The function to throttle
 * @param delay The throttle delay in milliseconds
 * @returns A throttled version of the callback
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  const timeout = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(callback);

  // Update the callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRun.current;

      const run = () => {
        lastRun.current = Date.now();
        callbackRef.current(...args);
      };

      if (timeSinceLastRun >= delay) {
        // If enough time has passed, run immediately
        run();
      } else {
        // Otherwise, schedule to run after the remaining delay
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
        timeout.current = setTimeout(run, delay - timeSinceLastRun);
      }
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  return throttledCallback;
}