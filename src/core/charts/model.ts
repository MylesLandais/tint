export type ChartDatum = Readonly<Record<string, string | number | null | undefined>>
export type ChartSeries = { key: string; label: string; color?: string; stackId?: string }
export type ChartKind = 'line' | 'bar'

export const FALLBACK_COLORS = [
  'var(--tint-accent)',
  'var(--tint-info)',
  'var(--tint-success)',
  'var(--tint-warning)',
  'var(--tint-danger)',
] as const

export type ChartPoint = { x: number; y: number; value: number; datum: ChartDatum; index: number }
export type ChartBar = ChartPoint & { width: number; height: number }
export type ChartLine = { series: ChartSeries; color: string; segments: readonly (readonly ChartPoint[])[] }
export type ChartBarSeries = { series: ChartSeries; color: string; bars: readonly ChartBar[] }
export type ChartScene = {
  width: number
  height: number
  plot: { left: number; top: number; width: number; height: number }
  yDomain: readonly [number, number]
  yTicks: readonly { value: number; y: number }[]
  xTicks: readonly { value: ChartDatum[string]; datum: ChartDatum; x: number }[]
  zeroY: number
  lines: readonly ChartLine[]
  bars: readonly ChartBarSeries[]
}

export function chartValue(value: unknown): value is ChartDatum[string] {
  return value == null || typeof value === 'string' || typeof value === 'number'
}

/** A numeric string is a valid source value, matching the chart data contract. */
export function chartNumber(value: ChartDatum[string]): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || value.trim() === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function domainFor(kind: ChartKind, data: readonly ChartDatum[], series: readonly ChartSeries[]): [number, number] {
  let min = kind === 'bar' ? 0 : Number.POSITIVE_INFINITY
  let max = kind === 'bar' ? 0 : Number.NEGATIVE_INFINITY
  let seen = false
  for (const datum of data) {
    const positive = new Map<string, number>()
    const negative = new Map<string, number>()
    for (const entry of series) {
      const value = chartNumber(datum[entry.key])
      if (value === null) continue
      seen = true
      if (kind === 'bar' && entry.stackId) {
        const bucket = value >= 0 ? positive : negative
        const next = Math.max(-Number.MAX_VALUE, Math.min(Number.MAX_VALUE, (bucket.get(entry.stackId) ?? 0) + value))
        bucket.set(entry.stackId, next)
        min = Math.min(min, next)
        max = Math.max(max, next)
      } else {
        min = Math.min(min, value)
        max = Math.max(max, value)
      }
    }
  }
  if (!seen) return [0, 1]
  if (min === max) return min > 0 ? [0, max] : min < 0 ? [min, 0] : [0, 1]
  return [min, max]
}

/** Deterministic SVG geometry; DOM measurement and rendering stay in Svelte. */
export function buildChartScene(
  kind: ChartKind,
  data: readonly ChartDatum[],
  series: readonly ChartSeries[],
  xKey: string,
  height = 280,
  width = 720,
): ChartScene {
  const safeWidth = Number.isFinite(width) && width > 0 ? Math.max(160, width) : 720
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 280
  const plot = { left: 54, top: 16, width: safeWidth - 70, height: Math.max(16, safeHeight - 76) }
  const [min, max] = domainFor(kind, data, series)
  const scale = Math.max(1, Math.abs(min), Math.abs(max))
  const scaledMin = min / scale
  const scaledMax = max / scale
  const y = (value: number) => plot.top + ((scaledMax - value / scale) / (scaledMax - scaledMin)) * plot.height
  const band = plot.width / Math.max(1, data.length)
  const lineX = (index: number) => plot.left + (data.length === 1 ? plot.width / 2 : (index / (data.length - 1)) * plot.width)
  const barX = (index: number) => plot.left + (index + 0.5) * band
  const groups = [...new Set(series.map((entry) => entry.stackId ? `stack:${entry.stackId}` : `series:${entry.key}`))]
  const groupWidth = Math.min(64, band * 0.75) / Math.max(1, groups.length)
  const lines: ChartLine[] = []
  const bars: ChartBarSeries[] = []
  series.forEach((entry, seriesIndex) => {
    const color = entry.color ?? FALLBACK_COLORS[seriesIndex % FALLBACK_COLORS.length]!
    if (kind === 'line') {
      const segments: ChartPoint[][] = []
      let segment: ChartPoint[] = []
      data.forEach((datum, index) => {
        const value = chartNumber(datum[entry.key])
        if (value === null) {
          if (segment.length) segments.push(segment)
          segment = []
        } else {
          segment.push({ x: lineX(index), y: y(value), value, datum, index })
        }
      })
      if (segment.length) segments.push(segment)
      lines.push({ series: entry, color, segments })
    } else {
      const barsForSeries: ChartBar[] = []
      data.forEach((datum, index) => {
        const value = chartNumber(datum[entry.key])
        if (value === null) return
        let start = 0
        if (entry.stackId) {
          for (const previous of series.slice(0, seriesIndex)) {
            if (previous.stackId !== entry.stackId) continue
            const previousValue = chartNumber(datum[previous.key])
            if (previousValue !== null && (previousValue >= 0) === (value >= 0)) {
              start = Math.max(-Number.MAX_VALUE, Math.min(Number.MAX_VALUE, start + previousValue))
            }
          }
        }
        const end = Math.max(-Number.MAX_VALUE, Math.min(Number.MAX_VALUE, start + value))
        const top = Math.min(y(start), y(end))
        const group = groups.indexOf(entry.stackId ? `stack:${entry.stackId}` : `series:${entry.key}`)
        barsForSeries.push({
          x: barX(index) - (groups.length * groupWidth) / 2 + group * groupWidth,
          y: top,
          width: Math.max(1, groupWidth - 2),
          height: Math.max(0, Math.abs(y(end) - y(start))),
          value,
          datum,
          index,
        })
      })
      bars.push({ series: entry, color, bars: barsForSeries })
    }
  })
  return {
    width: safeWidth, height: safeHeight, plot,
    yDomain: [min, max],
    yTicks: Array.from({ length: 5 }, (_, index) => {
      const value = (scaledMin + (scaledMax - scaledMin) * index / 4) * scale
      return { value, y: y(value) }
    }),
    xTicks: data.map((datum, index) => ({ value: datum[xKey], datum, x: kind === 'bar' ? barX(index) : lineX(index) })),
    zeroY: y(0), lines, bars,
  }
}
