import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The parent workspace hosts Vite 6 consumers while Tint uses Vite 8. At
  // runtime Vitest accepts the standard plugin contract; only the duplicate
  // nominal Vite types disagree when this submodule is built in the workspace.
  plugins: [react() as never],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // `restoreMocks` alone only unwinds `vi.spyOn`. The long-lived `vi.fn()` that
    // setup.ts installs as `navigator.clipboard.writeText` keeps its call history
    // otherwise, which makes call-count assertions depend on test order.
    clearMocks: true,
  },
})
