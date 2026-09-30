import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { ChartDatum, ChartSeries } from '../../../core/charts/model'

export type { ChartDatum, ChartSeries } from '../../../core/charts/model'
export type ChartFormatter = (value: ChartDatum[string], datum?: ChartDatum) => string | number | null | undefined

export type ChartProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  data: readonly ChartDatum[]
  series: readonly ChartSeries[]
  xKey: string
  height?: number
  empty?: string | Snippet
  xFormatter?: ChartFormatter
  valueFormatter?: ChartFormatter
  tableCaption?: string
  showTable?: boolean
  chartLabel?: string
}

export type MetricCardProps = Omit<HTMLAttributes<HTMLElement>, 'children'> & {
  label: string | number | Snippet
  value: string | number | Snippet
  hint?: string | number | Snippet
  icon?: Snippet
  tone?: 'default' | 'accent' | 'danger' | 'success'
  trend?: { direction: 'up' | 'down' | 'flat'; label: string }
}
