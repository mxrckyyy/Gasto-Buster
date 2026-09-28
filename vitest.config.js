import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Vitest configuration (unit + context tests).
 *
 * Kept separate from `vite.config.js` so the test runner never loads the
 * Tailwind plugin or the production chunking rules — tests only need the
 * React transform and a jsdom environment.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
});
