import { describe, expect, it } from 'vitest'
import { overflowDistance, scrollCycleSeconds } from './model'

describe('scrolling label model', () => {
  it('measures only positive overflow', () => {
    expect(overflowDistance(200, 150)).toBe(0)
    expect(overflowDistance(100, 260)).toBe(160)
  })

  it('holds the minimum cycle and scales with distance', () => {
    expect(scrollCycleSeconds(2)).toBe(3)
    expect(scrollCycleSeconds(140)).toBe(10)
  })
})
