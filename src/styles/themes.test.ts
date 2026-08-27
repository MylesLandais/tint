import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  parseHexColor,
  validateColorTokenPair,
} from '../test/contrastGuard.js'

/**
 * The safety net that replaced the hex fallbacks.
 *
 * Components reference tokens with no fallback, so a token a theme forgets to
 * declare does not degrade — it renders an invisible element. These tests fail
 * the build instead.
 */

const SRC = join(process.cwd(), 'src')
const STYLES = join(SRC, 'styles')
const THEMES_DIR = join(STYLES, 'themes')

/** Utility prefixes that can carry a color in Tailwind. */
const COLOR_UTILITIES =
  'bg|text|border|ring|outline|decoration|fill|stroke|from|via|to|shadow|caret|divide|placeholder|accent'

// `bg-tint-panel`, `hover:bg-tint-panel/95`, `focus-visible:outline-tint-accent`.
// Greedy so `text-tint-danger-ink` yields `danger-ink`, not `danger`.
const UTILITY = new RegExp(`(?:${COLOR_UTILITIES})-tint-([a-z0-9-]+)`, 'g')
// Raw references such as `shadow-[0_0_0_3px_var(--tint-accent-soft)]`.
const RAW = /var\(--tint-([a-z0-9-]+)\)/g

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(entry) && !entry.includes('.test.') ? [full] : []
  })
}

function tokensUsed() {
  const used = new Map<string, string[]>()
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8')
    for (const re of [UTILITY, RAW]) {
      re.lastIndex = 0
      for (const match of text.matchAll(re)) {
        const token = match[1]!
        const where = used.get(token) ?? []
        if (!where.includes(file)) where.push(file)
        used.set(token, where)
      }
    }
  }
  return used
}

function tokensDeclaredIn(file: string) {
  const text = readFileSync(join(THEMES_DIR, file), 'utf8')
  return new Set(
    [...text.matchAll(/^\s*--tint-([a-z0-9-]+)\s*:/gm)].map((m) => m[1]!),
  )
}

/** The bridge is the list Tailwind can actually generate utilities from. */
function tokensBridged() {
  const text = readFileSync(join(STYLES, 'contract.css'), 'utf8')
  return new Set(
    [...text.matchAll(/--color-tint-([a-z0-9-]+)\s*:\s*var\(--tint-/g)].map((m) => m[1]!),
  )
}

const THEME_FILES = readdirSync(THEMES_DIR).filter((f) => f.endsWith('.css'))

type Scheme = 'light' | 'dark'
type TokenPair = readonly [foreground: string, background: string]

const CONTRAST_PAIRS: readonly TokenPair[] = [
  ['ink', 'bg'],
  ['ink', 'surface'],
  ['ink', 'panel'],
  ['muted', 'bg'],
  ['muted', 'surface'],
  ['muted', 'panel'],
  ['on-accent', 'accent'],
  ['on-accent', 'accent-hover'],
  ['danger-ink', 'danger-soft'],
  ['warning-ink', 'warning-soft'],
  ['success-ink', 'success-soft'],
  ['info-ink', 'info-soft'],
  ['code-ink', 'code'],
  ['code-muted', 'code'],
] as const

function themeTokens(file: string): Map<string, string> {
  const text = readFileSync(join(THEMES_DIR, file), 'utf8')
  return new Map(
    [...text.matchAll(/--tint-([a-z0-9-]+)\s*:\s*([^;]+);/g)].map(
      ([, token, value]) => [token!, value!.trim()],
    ),
  )
}

function resolveColor(value: string, scheme: Scheme): string {
  const lightDark = /^light-dark\(\s*(#[\da-f]{6,8})\s*,\s*(#[\da-f]{6,8})\s*\)$/i.exec(
    value,
  )
  if (lightDark) return scheme === 'light' ? lightDark[1]! : lightDark[2]!
  return value
}

describe('theme contract', () => {
  it('ships more than one theme to compare', () => {
    expect(THEME_FILES.length).toBeGreaterThan(1)
  })

  it('declares every token the components actually use', () => {
    const used = tokensUsed()
    expect(used.size).toBeGreaterThan(10)

    const declared = tokensDeclaredIn('tint.css')
    const missing = [...used.keys()]
      .filter((token) => !declared.has(token))
      .map((token) => `--tint-${token} (used in ${used.get(token)!.join(', ')})`)

    expect(missing).toEqual([])
  })

  it.each(THEME_FILES)('%s declares the full contract', (file) => {
    // Every theme is self-contained: switching palettes replaces the whole
    // surface rather than inheriting stray values from the default.
    const base = tokensDeclaredIn('tint.css')
    const declared = tokensDeclaredIn(file)
    const missing = [...base].filter((token) => !declared.has(token)).sort()

    expect(missing).toEqual([])
  })

  it.each(THEME_FILES)('%s declares no token outside the contract', (file) => {
    const base = tokensDeclaredIn('tint.css')
    const extra = [...tokensDeclaredIn(file)].filter((t) => !base.has(t)).sort()

    expect(extra).toEqual([])
  })

  it.each(THEME_FILES)('%s keeps semantic color pairs at WCAG AA contrast', (file) => {
    const tokens = themeTokens(file)

    for (const scheme of ['light', 'dark'] as const) {
      for (const [foregroundToken, backgroundToken] of CONTRAST_PAIRS) {
        const foreground = resolveColor(tokens.get(foregroundToken)!, scheme)
        const background = resolveColor(tokens.get(backgroundToken)!, scheme)
        validateColorTokenPair(
          `${file}/${scheme}: --tint-${foregroundToken} on --tint-${backgroundToken}`,
          parseHexColor(foreground),
          parseHexColor(background),
        )
      }
    }
  })

  it('bridges every contract token into a Tailwind utility', () => {
    const declared = tokensDeclaredIn('tint.css')
    const bridged = tokensBridged()
    // `shadow-color` is consumed as a raw var() inside arbitrary shadow values,
    // so it is bridged under a shorter utility name.
    const unbridged = [...declared].filter(
      (token) => !bridged.has(token) && token !== 'shadow-color',
    )

    expect(unbridged).toEqual([])
  })

  it('pairs every scheme-dependent token with light-dark()', () => {
    for (const file of THEME_FILES) {
      const text = readFileSync(join(THEMES_DIR, file), 'utf8')
      for (const [, token, value] of text.matchAll(
        /--tint-([a-z0-9-]+)\s*:\s*([^;]+);/g,
      )) {
        // Chrome overlays video and must not flip; accents that hold against
        // both backgrounds may legitimately be a single value.
        if (token!.startsWith('chrome')) {
          expect(value).not.toContain('light-dark(')
        }
      }
    }
  })

  it('leaves no untokenized palette color in the library', () => {
    const offenders: string[] = []
    const palette =
      /(?:bg|text|border|ring|outline|decoration|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b|\bbg-white\b|\btext-white\b/

    for (const file of sourceFiles(join(SRC, 'components'))) {
      for (const [index, line] of readFileSync(file, 'utf8').split('\n').entries()) {
        if (palette.test(line)) offenders.push(`${file}:${index + 1}`)
      }
    }

    expect(offenders).toEqual([])
  })
})
