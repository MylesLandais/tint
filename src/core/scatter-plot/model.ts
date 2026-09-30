export type ScatterPoint = { id: string; label?: string; x: number; y: number }

export type ScatterAxis = {
  min: number
  max: number
  ratio: (value: number) => number
}

export function validScatterRows(rows: readonly ScatterPoint[]): ScatterPoint[] {
  return rows.filter((row) => Number.isFinite(row.x) && Number.isFinite(row.y))
}

/** Scale before subtraction so finite extreme values cannot overflow the range. */
export function scatterAxis(values: readonly number[]): ScatterAxis {
  const min = values.reduce((smallest, value) => Math.min(smallest, value), 0)
  const max = values.reduce((largest, value) => Math.max(largest, value), 0)
  const scale = Math.max(Math.abs(min), Math.abs(max)) || 1
  const range = max / scale - min / scale || 1
  return { min, max, ratio: (value) => (value / scale - min / scale) / range }
}

export function scatterCoordinates(point: ScatterPoint, x: ScatterAxis, y: ScatterAxis): { cx: number; cy: number } {
  return { cx: 80 + x.ratio(point.x) * 530, cy: 220 - y.ratio(point.y) * 196 }
}
