import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * ScrollingLabel's behavioural contract lives in CSS (jsdom never applies it),
 * so this asserts on the stylesheet the way exports.test.ts asserts on the
 * barrels. Two guarantees matter:
 *
 * - Hover and keyboard focus must remove the animation — pause AND reset the
 *   offset, not pause-only — or the title becomes unreadable and unclickable.
 * - `prefers-reduced-motion` must disable the scroll entirely (the label
 *   degrades to a static ellipsis).
 *
 * Reads source rather than importing it; see exports.test.ts for why.
 */
describe('scrolling-label stylesheet contract', () => {
  const css = readFileSync(path.resolve(import.meta.dirname, '../../index.css'), 'utf8')

  it('defines the marquee keyframes the component references', () => {
    expect(css).toContain('@keyframes tint-scrolling-label')
    expect(css).toContain('--tint-scrolling-label-distance')
  })

  it('pauses and resets on hover and focus-within', () => {
    expect(css).toContain('[data-scrolling-label]:is(:hover, :focus-within)')
  })

  it('disables the scroll under reduced motion', () => {
    expect(css).toContain('prefers-reduced-motion: reduce')
  })
})
