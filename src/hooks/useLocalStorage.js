/**
 * Gasto Buster — useLocalStorage hook.
 *
 * A safe, cross-tab-synced wrapper around browser localStorage.
 * - JSON parse/serialize with try-catch to prevent runtime crashes.
 * - Listens to `storage` events so state syncs across multi-tab sessions.
 * - Falls back gracefully to initial values if localStorage is empty or malformed.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * @template T
 * @param {string} key - The localStorage key to read/write.
 * @param {T} initialValue - Fallback value when storage is empty or corrupt.
 * @returns {[T, (value: T | ((prev: T) => T)) => void, () => void]}
 *   A tuple of [state, setValue, removeValue].
 */
export default function useLocalStorage(key, initialValue) {
  // Lazy initializer: read from localStorage once on mount.
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(
        `[useLocalStorage] Failed to read key "${key}" from localStorage:`,
        error
      );
      return initialValue;
    }
  });

  /**
   * Write a new value to both React state and localStorage.
   * Accepts a direct value or an updater function.
   */
  const setValue = useCallback(
    (value) => {
      try {
        // Resolve the value if it's an updater function.
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        if (valueToStore === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(
          `[useLocalStorage] Failed to write key "${key}" to localStorage:`,
          error
        );
      }
    },
    [key, storedValue]
  );

  /**
   * Remove the key from both React state and localStorage.
   */
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(
        `[useLocalStorage] Failed to remove key "${key}" from localStorage:`,
        error
      );
    }
  }, [key, initialValue]);

  /**
   * Cross-tab sync: listen for `storage` events so other tabs that write
   * to the same key update this tab's state in real time.
   */
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== key) return;

      try {
        const newValue =
          event.newValue !== null ? JSON.parse(event.newValue) : initialValue;
        setStoredValue(newValue);
      } catch (error) {
        console.warn(
          `[useLocalStorage] Failed to parse storage event for key "${key}":`,
          error
        );
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
