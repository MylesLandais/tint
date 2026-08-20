import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The rule: render every icon through `Icon` / `StatusIcon` / `Spinner`
 * rather than a raw lucide component styled by hand. This targets the
 * hand-rolled *pattern* — a capitalized self-closing tag carrying a size
 * and `aria-hidden="true"` — not `lucide-react` imports themselves, since
 * call sites still legitimately import specific icons as values to hand
 * to `Icon` (e.g. `<Icon icon={Search} />`).
 *
 * Size used to be matched only as a `size-*` class, so
 * `<Maximize2 size={16} aria-hidden="true" />` — the graph toolbar's original
 * form — slipped through. Numeric `size={…}` and `size="…"` are the same
 * pattern: a glyph sized at the call site instead of through Icon.
 */

const SRC = join(process.cwd(), 'src')
const ALLOWED_TAGS = new Set(['Icon', 'StatusIcon', 'Spinner'])

// Captures a self-closing JSX tag's name and attribute text, tolerating
// attributes spread across multiple lines.
const SELF_CLOSING_TAG = /<([A-Z][A-Za-z0-9]*)((?:[^<>])*?)\/>/g
const SIZED =
  /\bclassName=["'`][^"'`]*\bsize-[\w.]+\b|\bsize=\{?\s*\d+\s*\}?|\bsize=["']\d+["']/
const ARIA_HIDDEN = /aria-hidden=["']true["']/

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return entry.endsWith('.tsx') && !entry.includes('.test.') ? [full] : []
  })
}

describe('icon usage', () => {
  it('renders every icon through Icon / StatusIcon / Spinner', () => {
    const offenders: string[] = []

    for (const file of [
      ...sourceFiles(join(SRC, 'components')),
      ...sourceFiles(join(SRC, 'docs')),
    ]) {
      const text = readFileSync(file, 'utf8')
      SELF_CLOSING_TAG.lastIndex = 0
      for (const match of text.matchAll(SELF_CLOSING_TAG)) {
        const [, tag, attrs] = match
        if (!tag || ALLOWED_TAGS.has(tag)) continue
        if (SIZED.test(attrs ?? '') && ARIA_HIDDEN.test(attrs ?? '')) {
          offenders.push(`${file}: <${tag} .../>`)
        }
      }
    }

    expect(offenders).toEqual([])
  })
})
