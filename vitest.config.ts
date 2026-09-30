import path from 'node:path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Workspace consumers may resolve a different Vite type copy; the runtime
  // plugin contract is the same for both Svelte plugins.
  plugins: [svelte() as never, svelteTesting() as never],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
    exclude: ['e2e/**', 'node_modules/**', 'src/components/**', 'src/client/**/*.test.tsx'],
  },
})
