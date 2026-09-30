import { describe, expect, it } from 'vitest'
import { normalizeProgress } from './model'

describe('normalizeProgress', () => {
  it('keeps values in the determinate range', () => {
    expect(normalizeProgress(-25)).toBe(0)
    expect(normalizeProgress(42.5)).toBe(42.5)
    expect(normalizeProgress(125)).toBe(100)
  })

  it('treats non-finite readings as zero', () => {
    expect(normalizeProgress(Number.NaN)).toBe(0)
    expect(normalizeProgress(Infinity)).toBe(0)
  })
})
