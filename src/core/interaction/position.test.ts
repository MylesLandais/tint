import { describe, expect, it } from 'vitest'
import { positionOverlay } from './position'

describe('positionOverlay', () => {
  const overlay = { width: 80, height: 40 }
  const viewport = { width: 300, height: 200 }

  it('places below an anchor when there is room', () => {
    expect(positionOverlay({ top: 20, bottom: 40, left: 15, right: 35, width: 20, height: 20 }, overlay, viewport)).toEqual({ top: 48, left: 15, side: 'bottom' })
  })

  it('flips before clipping and clamps inside the viewport', () => {
    const position = positionOverlay({ top: 175, bottom: 195, left: 290, right: 300, width: 10, height: 20 }, overlay, viewport)
    expect(position).toEqual({ top: 127, left: 212, side: 'top' })
  })
})
