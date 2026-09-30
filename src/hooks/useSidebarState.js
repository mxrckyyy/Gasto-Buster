/**
 * Gasto Buster — useSidebarState hook.
 *
 * Persists the desktop sidebar mode ('expanded' | 'collapsed') to
 * localStorage['gb.sidebar'] (JSON-encoded, like every other key, via
 * useLocalStorage — the only hook allowed to touch storage).
 * The mobile drawer open state is intentionally NOT persisted here.
 */

import useLocalStorage from './useLocalStorage.js';

const SIDEBAR_STORAGE_KEY = 'gb.sidebar';

/** @returns {{ mode: 'expanded' | 'collapsed', toggle: () => void, setMode: (mode: 'expanded' | 'collapsed') => void }} */
export default function useSidebarState() {
  const [storedMode, setStoredMode] = useLocalStorage(SIDEBAR_STORAGE_KEY, 'expanded');

  // Fail closed: anything but an explicit 'collapsed' renders expanded.
  const mode = storedMode === 'collapsed' ? 'collapsed' : 'expanded';

  const toggle = () => setStoredMode(mode === 'expanded' ? 'collapsed' : 'expanded');

  return { mode, toggle, setMode: setStoredMode };
}
