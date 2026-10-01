import '@testing-library/jest-dom/vitest';

/**
 * jsdom does not implement `crypto.randomUUID` on older builds; the app uses
 * it to mint record ids in `useExpenses`, so polyfill it for the test env
 * only (never in application code).
 */
if (typeof globalThis.crypto?.randomUUID !== 'function') {
  let counter = 0;
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    configurable: true,
    writable: true,
    value: () => `test-uuid-${(counter += 1)}`,
  });
}

/**
 * jsdom does not implement `ResizeObserver` (Recharts' ResponsiveContainer
 * needs it) — a no-op class keeps chart mounts quiet in tests.
 */
if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

/**
 * jsdom does not implement `Element.prototype.scrollIntoView` (the Sidebar
 * uses it after a view swap) — a vi.fn lets tests assert the scroll too.
 */
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = vi.fn();
}

/** Fresh, isolated browser storage for every test. */
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});
