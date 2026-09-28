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

/** Fresh, isolated browser storage for every test. */
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});
