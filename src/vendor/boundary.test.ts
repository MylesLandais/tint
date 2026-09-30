import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Each vendored engine is reachable from exactly one directory.
 *
 * The two remaining vendored engines are imported through their plain
 * TypeScript seams. Search real specifiers, including Svelte and CSS imports,
 * so implementation comments cannot accidentally pass or fail this check.
 */
const ROOT = path.resolve(import.meta.dirname, '../..')

/** Vendor directory -> the transition seams allowed to import it. */
const SEAMS = {
  yjs: ['src/core/collab/'],
  'tanstack-table-core': ['src/core/table/', 'src/components/table/'],
} as const

/**
 * Real import specifiers only — `import`/`export ... from '...'`, bare
 * `import '...'`, dynamic `import('...')`, and CSS `@import '...'`. Prose that
 * merely names a vendor path is not an import.
 */
const SPECIFIER =
  /(?:\bfrom\s*|(?:^|[\s;{(])import\s*|@import\s+)['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g

function importedPaths(source: string): string[] {
  return [...source.matchAll(SPECIFIER)].map(([, a, b]) => a ?? b).filter((s) => s != null)
}

const SOURCES = globSync('src/**/*.{ts,tsx,js,svelte,css}', { cwd: ROOT })
  .filter((file) => !file.replaceAll('\\', '/').startsWith('src/vendor/'))
  .map((file) => file.replaceAll('\\', '/'))

describe('vendor boundaries', () => {
  it('finds the source files it is meant to be guarding', () => {
    // A glob that silently matched nothing would make every assertion below pass.
    expect(SOURCES.length).toBeGreaterThan(100)
    expect(SOURCES).toContain('src/core/table/engine.ts')
  })

  it.each(Object.entries(SEAMS))('%s is imported only from its seam', (vendor, allowed) => {
    const offenders = SOURCES.filter((file) => {
      if (allowed.some((prefix) => file === prefix || file.startsWith(prefix))) return false
      const source = readFileSync(path.join(ROOT, file), 'utf8')
      return importedPaths(source).some((specifier) =>
        specifier.includes(`vendor/${vendor}`),
      )
    })

    expect(offenders).toEqual([])
  })

  /** Focused package seams may forward stable helpers; the root entries must not. */
  it('keeps vendor imports out of root UI barrels', () => {
    const barrels = ['src/index.ts', 'src/svelte/index.ts']
    const leaks = barrels.filter((file) =>
      importedPaths(readFileSync(path.join(ROOT, file), 'utf8')).some((specifier) =>
        Object.keys(SEAMS).some((vendor) => specifier.includes(`vendor/${vendor}`)),
      ),
    )

    expect(leaks).toEqual([])
  })
})
