import { describe, expect, it } from 'vitest'
import { classifyFiles, safeAssetIndex } from './assets'

describe('media assets', () => {
  it('classifies file constraints in count, type, size order', () => {
    const image = new File(['a'], 'cover.png', { type: 'image/png' })
    const text = new File(['a'], 'note.txt', { type: 'text/plain' })
    const large = new File(['abc'], 'large.png', { type: 'image/png' })
    const result = classifyFiles([image, text, large], { accept: ['image/*'], maxSizeBytes: 2, maxFiles: 3 })
    expect(result.accepted).toEqual([image])
    expect(result.rejected.map((item) => item.reason)).toEqual(['type', 'size'])
    expect(classifyFiles([image, text], { maxFiles: 1 }).rejected[0].reason).toBe('count')
  })

  it('keeps a controlled lightbox index inside the asset range', () => {
    expect(safeAssetIndex(10, 3)).toBe(2)
    expect(safeAssetIndex(-2, 3)).toBe(0)
    expect(safeAssetIndex(0, 0)).toBe(0)
  })
})
