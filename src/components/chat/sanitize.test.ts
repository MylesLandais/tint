import { describe, expect, it } from 'vitest'
import { safeHref, stripBidi } from './sanitize'

// Escapes rather than literals: these characters are invisible in an editor, and
// a test for invisible-character handling should show what it is testing.
const RLO = '\u202E' // right-to-left override
const LRE = '\u202A'
const RLE = '\u202B'
const PDF = '\u202C'
const LRO = '\u202D'
const LRI = '\u2066'
const RLI = '\u2067'
const FSI = '\u2068'
const PDI = '\u2069'
const LRM = '\u200E' // directional *mark* — deliberately preserved
const RLM = '\u200F'

describe('stripBidi', () => {
  it('removes the override that lets a filename lie about its extension', () => {
    // Renders as "invoiceexe.png" anywhere bidi is honored.
    const spoofed = `invoice${RLO}gnp.exe`

    expect(stripBidi(spoofed)).toBe('invoicegnp.exe')
    expect(stripBidi(spoofed)).not.toContain(RLO)
  })

  it('removes every embedding, override, and isolate in the string', () => {
    expect(stripBidi(`${LRE}a${RLE}b${PDF}c${LRO}d${RLO}e`)).toBe('abcde')
    expect(stripBidi(`${LRI}x${RLI}y${FSI}z${PDI}`)).toBe('xyz')
  })

  it('is stable across repeated calls', () => {
    // A single module-level /g regex used for both test and replace would
    // alternate between hit and miss here via its `lastIndex`.
    const spoofed = `report${RLO}fdp.exe`

    expect(stripBidi(spoofed)).toBe('reportfdp.exe')
    expect(stripBidi(spoofed)).toBe('reportfdp.exe')
    expect(stripBidi(spoofed)).toBe('reportfdp.exe')
  })

  it('leaves ordinary text and legitimate directional marks alone', () => {
    expect(stripBidi('Ada Lovelace')).toBe('Ada Lovelace')
    expect(stripBidi('')).toBe('')
    // Marks carry no reordering power and appear in real mixed-direction names.
    expect(stripBidi(`${LRM}מחברת${RLM}`)).toBe(`${LRM}מחברת${RLM}`)
  })
})

describe('safeHref', () => {
  it('allows navigable schemes and same-document targets', () => {
    expect(safeHref('https://example.com')).toBe('https://example.com')
    expect(safeHref('http://example.com')).toBe('http://example.com')
    expect(safeHref('mailto:hi@example.com')).toBe('mailto:hi@example.com')
    expect(safeHref('/docs')).toBe('/docs')
    expect(safeHref('#section')).toBe('#section')
  })

  it('rejects script-bearing and local-file schemes', () => {
    expect(safeHref('javascript:alert(1)')).toBeUndefined()
    expect(safeHref('data:text/html,<script>alert(1)</script>')).toBeUndefined()
    expect(safeHref('vbscript:msgbox(1)')).toBeUndefined()
    expect(safeHref('file:///etc/passwd')).toBeUndefined()
  })

  it('rejects empty and unparseable values', () => {
    expect(safeHref(undefined)).toBeUndefined()
    expect(safeHref('')).toBeUndefined()
    expect(safeHref('not a url')).toBeUndefined()
  })
})
