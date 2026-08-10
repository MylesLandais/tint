import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Each vendored engine is reachable from exactly one directory.
 *
 * The rule is what makes vendoring survivable: `src/vendor/` holds a bundle
 * nobody reads, so the only defence against it leaking through the codebase is
 * that a single seam imports it. That rule was written in comments — at
 * `src/components/table/engine.ts` and `src/components/collab/createCollabSession.ts`
 * — and enforced nowhere, for two of the three vendors.
 *
 * The graph module arrived with a version of this test that had three problems,
 * all of which this fixes:
 *
 * - It globbed `.ts`/`.tsx` only, so `graph.css`'s `@import` of the xyflow
 *   stylesheet — a second seam, outside the adapter — was invisible.
 * - It matched the substring `vendor/xyflow` anywhere in the file, so a comment
 *   naming the path was an offence. This very suite tripped it.
 * - Its escape hatch exempted *any* directory named `adapter/` anywhere under
 *   `src`, not just the graph's.
 */
const ROOT = path.resolve(import.meta.dirname, '../..')

/** Vendor directory -> the only place allowed to import it. */
const SEAMS = {
  yjs: ['src/components/collab/'],
  'tanstack-table-core': ['src/components/table/'],
  // The React adapter owns the runtime; the stylesheet owns the CSS import,
  // and is delivered to hosts as `tint/graph/styles.css`.
  xyflow: ['src/components/graph/adapter/', 'src/components/graph/graph.css'],
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

const SOURCES = globSync('src/**/*.{ts,tsx,css}', { cwd: ROOT })
  .filter((file) => !file.replaceAll('\\', '/').startsWith('src/vendor/'))
  .map((file) => file.replaceAll('\\', '/'))

describe('vendor boundaries', () => {
  it('finds the source files it is meant to be guarding', () => {
    // A glob that silently matched nothing would make every assertion below pass.
    expect(SOURCES.length).toBeGreaterThan(100)
    expect(SOURCES).toContain('src/components/graph/graph.css')
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

  /**
   * The seam is only a seam if the types stop there too: re-exporting an xyflow
   * type from the adapter would put the vendored engine back in tint's public
   * API, where an upgrade becomes a breaking change for consumers.
   */
  it('keeps vendored types out of the public barrels', () => {
    const barrels = SOURCES.filter((file) => file.endsWith('/index.ts'))
    const leaks = barrels.filter((file) =>
      importedPaths(readFileSync(path.join(ROOT, file), 'utf8')).some((specifier) =>
        specifier.includes('vendor/xyflow'),
      ),
    )

    expect(leaks).toEqual([])
  })
})
