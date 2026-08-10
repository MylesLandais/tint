import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every PROVENANCE.md states the SHA-256 of the bundle it vendored. Until now
 * those were prose: nothing recomputed them, so an edit to a vendored bundle —
 * a "quick fix" that turns a dependency into an undocumented fork — left the
 * recorded hash describing a file that no longer existed.
 *
 * The vendor directories' own rule says it best: "A silently modified vendor
 * directory is how a dependency becomes a fork nobody remembers making." This is
 * that rule, enforced.
 *
 * A failure here is not "update the number". It means either the bundle was
 * edited in place (re-vendor instead, and record what upstream changed) or a
 * re-vendor landed without updating PROVENANCE.
 */
const ROOT = path.resolve(import.meta.dirname, '../..')

const VENDORS = [
  { name: 'xyflow', bundle: 'src/vendor/xyflow/index.js' },
  { name: 'yjs', bundle: 'src/vendor/yjs/index.js' },
  { name: 'tanstack-table-core', bundle: 'src/vendor/tanstack-table-core/index.js' },
] as const

function sha256(relative: string): string {
  return createHash('sha256').update(readFileSync(path.join(ROOT, relative))).digest('hex')
}

/** The `| Bundle SHA-256 | <hex> |` row. Every vendor records one. */
function recordedBundleHash(name: string): string | undefined {
  const provenance = readFileSync(
    path.join(ROOT, 'src/vendor', name, 'PROVENANCE.md'),
    'utf8',
  )
  return /Bundle SHA-256\s*\|\s*`?([0-9a-f]{64})`?/i.exec(provenance)?.[1]
}

describe('vendored bundles match their provenance', () => {
  it.each(VENDORS)('$name', ({ name, bundle }) => {
    // Asserted rather than skipped-if-absent: a provenance that stops recording
    // its hash would otherwise silently opt out of the check it exists to pass.
    expect(recordedBundleHash(name)).toBe(sha256(bundle))
  })
})
