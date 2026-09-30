import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The package's two entry styles have to agree.
 *
 * `@nebula/tint` (the root barrel) and `@nebula/tint/<component>` (the focused subpaths) are
 * both documented, and a value that exists on one but not the other is a paper
 * cut you only discover at the import site. Thirteen table values — including
 * `toDeriveFilters` and `toTableSort`, which the README's own example uses —
 * were reachable only from `@nebula/tint/table`.
 *
 * Reads source rather than importing it: the point is what the barrels *declare*,
 * and several subpaths pull in xterm or Tiptap that a Node-side test should not
 * have to boot.
 */
const ROOT = path.resolve(import.meta.dirname, '..')

function read(relative: string) {
  return readFileSync(path.join(ROOT, relative), 'utf8')
}

/** Names in `export { ... } from '...'` clauses, ignoring `export type`. */
function exportedValues(source: string): Set<string> {
  const names = new Set<string>()
  const clause = /export\s+(type\s+)?\{([^}]*)\}\s*from/g
  for (const [, isType, body] of source.matchAll(clause)) {
    if (isType) continue
    for (const entry of body.split(',')) {
      const cleaned = entry.trim()
      if (!cleaned || cleaned.startsWith('type ')) continue
      // `default` is re-exported by two barrels but is not a named value.
      const name = (cleaned.split(/\s+as\s+/).pop() ?? cleaned).trim()
      if (name && name !== 'default') names.add(name)
    }
  }
  return names
}

const packageJson = JSON.parse(read('package.json')) as {
  exports: Record<string, string>
}

/** Subpath -> barrel file, excluding CSS and the root entry itself. */
const SUBPATHS = Object.entries(packageJson.exports).filter(
  ([subpath, target]) => subpath !== '.' && target.endsWith('.ts'),
)

describe('package exports', () => {
  const rootValues = exportedValues(read('src/index.ts'))

  /**
   * `settings-popout` shipped from the root barrel with no `@nebula/tint/settings-popout`
   * subpath, so the focused import documented for every other component silently
   * did not exist. This asserted that one path by name, which caught that case and
   * nothing else — a new component directory could still ship unexported.
   */
  it('declares a subpath for every component barrel', () => {
    const declared = new Set(SUBPATHS.map(([, target]) => target))

    const undeclared = readdirSync(path.join(ROOT, 'src/components'))
      .filter((name) =>
        existsSync(path.join(ROOT, 'src/components', name, 'index.ts')),
      )
      .map((name) => `./src/components/${name}/index.ts`)
      .filter((target) => !declared.has(target))

    expect(undeclared).toEqual([])
  })

  /**
   * Transport clients are intentionally absent from the root barrel: they are
   * reached as `@nebula/tint/auth-client` and `@nebula/tint/calendar-client` so that a host that
   * only renders components never pulls an HTTP client into its graph. Everything
   * else must be reachable from the root, or the focused import each docs page
   * advertises would be the only way to get at it.
   */
  const STANDALONE_ENTRY_POINTS = ['./auth', './calendar', './client', './svelte']

  it.each(
    SUBPATHS.filter(
      ([subpath]) => !STANDALONE_ENTRY_POINTS.some((prefix) => subpath.startsWith(prefix)),
    ),
  )('re-exports everything %s exposes', (_subpath, target) => {
    const missing = [...exportedValues(read(target.replace(/^\.\//, '')))].filter(
      (name) => !rootValues.has(name),
    )
    expect(missing).toEqual([])
  })
})
