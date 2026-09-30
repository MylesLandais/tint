import { describe, expect, it } from 'vitest'
import { releaseScatterRows } from './model'

describe('release chart adapter', () => {
  it('keeps only supplied finite scores with nonnegative release sizes', () => {
    const rows = [
      { id: 'zero', size: 0, score: 0 },
      { id: 'negative', size: -1, score: 1 },
      { id: 'infinite', size: Number.POSITIVE_INFINITY, score: 2 },
      { id: 'bad-score', size: 1, score: Number.NaN },
    ]
    expect(releaseScatterRows(rows)).toEqual([{ id: 'zero', x: 0, y: 0 }])
  })
})
