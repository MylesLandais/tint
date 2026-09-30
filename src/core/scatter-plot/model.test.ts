import { describe, expect, it } from 'vitest'
import { scatterAxis, scatterCoordinates, validScatterRows } from './model'

describe('scatter plot model', () => {
  it('filters only non-finite coordinates', () => {
    expect(validScatterRows([{ id: 'zero', x: 0, y: 0 }, { id: 'bad', x: Number.NaN, y: 1 }]).map((row) => row.id)).toEqual(['zero'])
  })

  it('keeps extreme finite values inside its plotting bounds', () => {
    const rows = [{ id: 'low', x: 0, y: -Number.MAX_VALUE }, { id: 'high', x: Number.MAX_VALUE, y: Number.MAX_VALUE }]
    const x = scatterAxis(rows.map((row) => row.x))
    const y = scatterAxis(rows.map((row) => row.y))
    const points = rows.map((row) => scatterCoordinates(row, x, y))
    expect(points[0].cx).toBe(80)
    expect(points[1].cx).toBe(610)
    expect(points[0].cy).toBe(220)
    expect(points[1].cy).toBe(24)
  })
})
