import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'e2e/**/*'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/test/**/*', 'src/**/*.d.ts', 'src/app/**/page.tsx', 'src/app/layout.tsx', 'src/lib/db.ts', 'src/lib/ai.ts', 'src/components/ChatDrawer.tsx'],
      thresholds: {
        lines: 80,
        branches: 70,
      }
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
