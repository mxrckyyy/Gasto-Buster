import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Dedicated vendor chunks so the entry bundle stays small.
        //
        // Function form, not the object form from the docs: Vite's object
        // form resolves bare specifiers into orphan modules that don't match
        // the module graph — it silently pulled react-dom into the recharts
        // chunk, which made the entry eagerly modulepreload it. The function
        // classifies the real resolved ids instead.
        //
        // Every package imported by the entry (react, forms, icons, zod) is
        // named explicitly; the recharts chunk claims only the recharts
        // package itself and Rollup's manual-chunk dependency walk sweeps its
        // d3/victory/lodash tree in after it. Anything unclassified stays out
        // of the recharts chunk, so a future eager dep can never make
        // Recharts load eagerly.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-hook-form') || id.includes('@hookform')) {
            return 'forms';
          }
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'vendor';
          }
          if (/[\\/]node_modules[\\/]lucide-react[\\/]/.test(id)) return 'lucide';
          if (/[\\/]node_modules[\\/]zod[\\/]/.test(id)) return 'zod';
          if (/[\\/]node_modules[\\/]recharts[\\/]/.test(id)) return 'recharts';
          return undefined;
        },
      },
    },
  },
});
