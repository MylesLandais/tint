import { globSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(import.meta.dirname, '..')
const ENGINES = {
  '@base-ui/react': ['src/components/dialog/Dialog.tsx', 'src/components/context-menu/ContextMenu.tsx', 'src/components/toast/Toast.tsx', 'src/components/menu/Menu.tsx'],
  recharts: ['src/components/charts/rechartsAdapter.tsx'],
  'react-grid-layout': ['src/components/workspace-grid/rglAdapter.tsx', 'src/index.css'],
} as const
const IMPORT = /(?:from\s*|import\s*|@import\s+)['"]([^'"]+)['"]/g

describe('published dependency boundaries', () => {
  it.each(Object.entries(ENGINES))('%s is isolated behind Tint adapters', (engine, allowed) => {
    const files = globSync('src/**/*.{ts,tsx,css}', { cwd: ROOT }).map((file) => file.replaceAll('\\', '/'))
    const offenders = files.filter((file) => {
      if ((allowed as readonly string[]).includes(file)) return false
      const source = readFileSync(path.join(ROOT, file), 'utf8')
      return [...source.matchAll(IMPORT)].some((match) => match[1] === engine || match[1]?.startsWith(`${engine}/`))
    })
    expect(offenders).toEqual([])
  })

  it('does not expose engine imports from public barrels', () => {
    const barrels = globSync('src/**/index.ts', { cwd: ROOT })
    const leaks = barrels.filter((file) => /@base-ui\/react|recharts|react-grid-layout/.test(readFileSync(path.join(ROOT, file), 'utf8')))
    expect(leaks).toEqual([])
  })
})
