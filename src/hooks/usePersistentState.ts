import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/** Browser-local persistence for this single-student installation. */
export function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T)
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved) as T;
    } catch {
      // Recover from malformed or unavailable browser storage with the defaults.
    }
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Keep the app usable if browser storage is disabled or full.
    }
  }, [key, value]);

  return [value, setValue];
}
