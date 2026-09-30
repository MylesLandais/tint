import { describe, expect, it } from 'vitest'
import { buildChartScene, chartNumber, chartValue } from './model'

describe('chart data model', () => {
  it('retains the public value contract and rejects invalid numbers from geometry', () => {
    expect(chartValue(Number.NaN)).toBe(true)
    expect(chartValue(false)).toBe(false)
    expect(chartNumber('12.5')).toBe(12.5)
    expect(chartNumber('')).toBeNull()
    expect(chartNumber(Number.POSITIVE_INFINITY)).toBeNull()
  })

  it('uses xKey, splits a line at missing values, and keeps finite points', () => {
    const data = [
      { other: 'wrong', time: 'first', value: 10 },
      { other: 'wrong', time: 'second', value: Number.NaN },
      { other: 'wrong', time: 'third', value: 12 },
    ]
    const scene = buildChartScene('line', data, [{ key: 'value', label: 'Value' }], 'time')
    expect(scene.xTicks.map((tick) => tick.value)).toEqual(['first', 'second', 'third'])
    expect(scene.lines[0]?.segments.map((segment) => segment.map((point) => point.value))).toEqual([[10], [12]])
    expect(scene.yDomain).toEqual([10, 12])
    expect(scene.lines[0]?.segments.flat().every((point) => Number.isFinite(point.y))).toBe(true)
  })

  it('stacks positive and negative bars separately while grouping unstacked series', () => {
    const scene = buildChartScene('bar', [{ time: 'now', a: 5, b: 3, c: -2, d: 4 }], [
      { key: 'a', label: 'A', stackId: 'requests' },
      { key: 'b', label: 'B', stackId: 'requests' },
      { key: 'c', label: 'C', stackId: 'requests' },
      { key: 'd', label: 'D' },
    ], 'time')
    expect(scene.yDomain).toEqual([-2, 8])
    expect(scene.bars[0]?.bars[0]?.x).toBe(scene.bars[1]?.bars[0]?.x)
    expect(scene.bars[0]?.bars[0]?.x).not.toBe(scene.bars[3]?.bars[0]?.x)
    expect(scene.bars[1]?.bars[0]?.y).toBeLessThan(scene.bars[0]?.bars[0]?.y)
    expect(scene.bars[2]?.bars[0]?.y).toBe(scene.zeroY)
  })

  it('keeps extreme finite opposing values inside the plot', () => {
    const scene = buildChartScene('line', [
      { time: 'low', value: -Number.MAX_VALUE },
      { time: 'high', value: Number.MAX_VALUE },
    ], [{ key: 'value', label: 'Value' }], 'time')
    const points = scene.lines[0]?.segments.flat() ?? []
    expect(points.map((point) => point.y)).toEqual([scene.plot.top + scene.plot.height, scene.plot.top])
    expect(scene.yTicks.every((tick) => Number.isFinite(tick.value) && Number.isFinite(tick.y))).toBe(true)
  })

  it('recomputes positions for a measured container width', () => {
    const series = [{ key: 'value', label: 'Value' }]
    const data = [{ time: 'a', value: 1 }, { time: 'b', value: 2 }]
    const wide = buildChartScene('line', data, series, 'time', 280, 720)
    const narrow = buildChartScene('line', data, series, 'time', 280, 360)
    expect(narrow.width).toBe(360)
    expect(narrow.plot.width).toBe(290)
    expect(narrow.lines[0]?.segments[0]?.[1]?.x).toBeLessThan(wide.lines[0]?.segments[0]?.[1]?.x ?? 0)
  })
})
