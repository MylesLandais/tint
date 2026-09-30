import { describe, expect, it } from 'vitest'
import { DEFAULT_CONNECTION_LABELS, normalizeSkeletonLines } from './model'

describe('status model', () => {
  it('always renders at least one skeleton line', () => {
    expect(normalizeSkeletonLines(0)).toBe(1)
    expect(normalizeSkeletonLines(2.8)).toBe(2)
    expect(normalizeSkeletonLines(Infinity)).toBe(3)
  })

  it('has a visible label for each connection state', () => {
    expect(Object.values(DEFAULT_CONNECTION_LABELS).every(Boolean)).toBe(true)
  })
})
