import { describe, expect, it } from 'vitest'
import { boxFromPoints, movedGeometry, normalizedPoint } from './model'

describe('annotation geometry intents', () => {
  it('normalizes a pointer and bounds a box', () => {
    const rect = { left: 20, top: 10, width: 200, height: 100 }
    expect(normalizedPoint(220, 60, rect)).toEqual({ x: 1, y: .5 })
    expect(normalizedPoint(220, 60, { ...rect, width: 0 })).toEqual({ x: 0, y: .5 })
    expect(boxFromPoints({ x: .8, y: .7 }, { x: .2, y: .1 })).toEqual({ kind: 'box', x: .2, y: .1, width: .6000000000000001, height: .6 })
  })

  it('clamps a polygon move while preserving its shape', () => {
    const geometry = { kind: 'polygon' as const, points: [{ x: .8, y: .3 }, { x: .9, y: .4 }, { x: .7, y: .5 }] }
    expect(movedGeometry(geometry, { x: .2, y: .2 }, { x: .6, y: .3 })).toEqual({ kind: 'polygon', points: [
      { x: .9, y: .39999999999999997 }, { x: 1, y: .5 }, { x: .7999999999999999, y: .6 },
    ] })
  })
})
