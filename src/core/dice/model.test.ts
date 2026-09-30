import { describe, expect, it } from 'vitest'
import { animationFace } from './model'

describe('animationFace', () => {
  it('chooses decorative faces within the selected die without owning the result', () => {
    expect(animationFace('d6', () => 0)).toBe(1)
    expect(animationFace('d10', () => 0.5)).toBe(6)
    expect(animationFace('d20', () => 0.999999)).toBe(20)
    expect(animationFace('d6', () => Number.NaN)).toBe(1)
  })
})
