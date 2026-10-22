import { describe, expect, it } from 'vitest'
import { jsonText } from './json'

describe('JSON evidence formatting', () => {
  it('preserves absent, null and falsy observations as distinct values', () => {
    expect(jsonText(undefined)).toEqual({ status: 'unavailable' })
    for (const value of [null, false, 0, '', [], {}]) {
      expect(jsonText(value)).toEqual({ status: 'ready', text: JSON.stringify(value, null, 2) })
    }
  })
  it('reports unrepresentable evidence without replacing it with fabricated JSON', () => {
    const circular: { self?: unknown } = {}
    circular.self = circular
    for (const value of [circular, 1n, () => {}, Symbol('x')]) expect(jsonText(value)).toEqual({ status: 'invalid' })
  })
})
