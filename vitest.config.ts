import path from 'node:path'
import react from '@vitejs/plugin-react'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { svelteTesting } from '@testing-library/svelte/vite'
import { defineConfig, type TestProjectInlineConfiguration } from 'vitest/config'

const alias = { '@': path.resolve(import.meta.dirname, './src') }

const shared: NonNullable<TestProjectInlineConfiguration['test']> = {
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  restoreMocks: true,
  // `restoreMocks` alone only unwinds `vi.spyOn`. The long-lived `vi.fn()` that
  // setup.ts installs as `navigator.clipboard.writeText` keeps its call history
  // otherwise, which makes call-count assertions depend on test order.
  clearMocks: true,
}

// Two projects because `svelteTesting()` applies the `browser` resolve condition
// globally, which flips unrelated React dependencies onto different builds and
// breaks their tests. Svelte tests get it; everything else runs as before.
export default defineConfig({
  test: {
    projects: [
      {
        // The parent workspace hosts Vite 6 consumers while Tint uses Vite 8. At
        // runtime Vitest accepts the standard plugin contract; only the duplicate
        // nominal Vite types disagree when this submodule is built in the workspace.
        plugins: [react() as never],
        resolve: { alias },
        test: {
          ...shared,
          name: 'react',
          exclude: ['e2e/**', 'node_modules/**', 'src/svelte/**', 'src/docs/svelte/**'],
        },
      },
      {
        plugins: [svelte() as never, svelteTesting() as never],
        resolve: { alias },
        test: {
          ...shared,
          name: 'svelte',
          include: ['src/svelte/**/*.test.ts', 'src/docs/svelte/**/*.test.ts'],
        },
      },
    ],
  },
})
