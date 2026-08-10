import { describe, expect, it } from 'vitest'

const sourceFiles = import.meta.glob('../../**/*.{ts,tsx}', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

function isGraphAdapterPath(path: string): boolean {
  return (
    path.includes('/components/graph/adapter/') ||
    path.includes('/graph/adapter/') ||
    // Vite may key same-folder matches relatively when the glob walks upward.
    /(?:^|\/)adapter\/[^/]+\.(?:ts|tsx)$/.test(path)
  )
}

/**
 * xyflow must stay behind the graph adapter seam — same rule as Yjs → collab
 * and TanStack → table.
 */
describe('graph vendor boundary', () => {
  it('only allows adapter files to import src/vendor/xyflow', () => {
    const offenders = Object.entries(sourceFiles).flatMap(([path, source]) => {
      if (path.includes('/vendor/xyflow/')) return []
      if (isGraphAdapterPath(path)) return []
      if (!source.includes('vendor/xyflow')) return []
      return [path]
    })

    expect(offenders).toEqual([])
  })
})
