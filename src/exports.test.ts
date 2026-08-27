import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The package's two entry styles have to agree.
 *
 * `tint` (the root barrel) and `tint/<component>` (the focused subpaths) are
 * both documented, and a value that exists on one but not the other is a paper
 * cut you only discover at the import site. Thirteen table values — including
 * `toDeriveFilters` and `toTableSort`, which the README's own example uses —
 * were reachable only from `tint/table`.
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

describe('docs coverage', () => {
  /**
   * Six components shipped as public exports with no docs page — `CodeTabs`,
   * `Panel`, `DiceRoller`, `SettingsPopout`, the media primitives, and
   * `VideoPlayer`. Nothing connected the two lists, so nothing noticed.
   */
  it('documents every component that has a package subpath', () => {
    const routes = read('src/docs/routes.ts')
    // Components whose entry point is deliberately not a docs page.
    const EXEMPT = new Set(['auth-client', 'auth'])

    // Members of a grouped page (see GROUPED_ROUTE_MEMBERS in routes.ts) are
    // documented by that page rather than by a route of their own.
    const groupedBlock = routes.match(/GROUPED_ROUTE_MEMBERS = \{([\s\S]*?)\n\}/)
    const groupedMembers = new Set(
      groupedBlock
        ? [...groupedBlock[1].matchAll(/'([^':]+)'(?!\s*:)/g)].map((match) => match[1])
        : [],
    )

    const undocumented = SUBPATHS.map(([subpath]) => subpath.replace(/^\.\//, ''))
      .filter((name) => !EXEMPT.has(name) && !name.includes('/'))
      .filter((name) => !routes.includes(`'components/${name}'`) && !groupedMembers.has(name))

    expect(undocumented).toEqual([])
  })
})

describe('package exports', () => {
  const rootValues = exportedValues(read('src/index.ts'))

  /**
   * `settings-popout` shipped from the root barrel with no `tint/settings-popout`
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

  it.each(
    SUBPATHS.filter(
      ([subpath]) =>
        // Auth ships as its own entry point and is intentionally absent from the
        // root barrel; see README.
        !subpath.startsWith('./auth'),
    ),
  )('re-exports everything %s exposes', (_subpath, target) => {
    const missing = [...exportedValues(read(target.replace(/^\.\//, '')))].filter(
      (name) => !rootValues.has(name),
    )
    expect(missing).toEqual([])
  })
})
