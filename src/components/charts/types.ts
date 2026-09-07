import type { HTMLAttributes, ReactNode } from 'react'

export type ChartDatum = Readonly<Record<string, string | number | null | undefined>>
export type ChartSeries = { key: string; label: string; color?: string; stackId?: string }
export type ChartFormatter = (value: string | number | null | undefined, datum?: ChartDatum) => ReactNode

export type ChartProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  data: readonly ChartDatum[]
  series: readonly ChartSeries[]
  xKey: string
  height?: number
  empty?: ReactNode
  xFormatter?: ChartFormatter
  valueFormatter?: ChartFormatter
  tableCaption?: string
  showTable?: boolean
}
