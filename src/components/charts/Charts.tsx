import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Surface } from '../surface'
import { BarEngine, TimeSeriesEngine } from './rechartsAdapter'
import type { ChartDatum, ChartProps } from './types'

export type MetricCardProps = HTMLAttributes<HTMLElement> & {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: 'default' | 'accent' | 'danger' | 'success'
  trend?: { direction: 'up' | 'down' | 'flat'; label: string }
}

export function MetricCard({ label, value, hint, icon, tone = 'default', trend, className, ...props }: MetricCardProps) {
  return (
    <Surface
      as="article"
      data-tint-metric-card=""
      tone={tone === 'danger' ? 'danger' : tone === 'accent' ? 'accent' : 'default'}
      className={cn('px-3 py-2.5', tone === 'success' && 'border-tint-success/40', className)}
      {...props}
    >
      <p className="m-0 flex items-center gap-1.5 text-[0.6875rem] font-medium tracking-wide text-tint-muted uppercase">{icon}{label}</p>
      <p className="m-0 mt-1 text-lg font-semibold text-tint-ink">{value}</p>
      {hint || trend ? <p className="m-0 mt-0.5 text-[0.6875rem] text-tint-muted">{hint}{hint && trend ? ' · ' : null}{trend ? <span data-direction={trend.direction}>{trend.label}</span> : null}</p> : null}
    </Surface>
  )
}

function AccessibleTable({ data, xKey, series, xFormatter, valueFormatter, caption }: ChartProps & { caption: string }) {
  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-left text-xs">
        <caption className="sr-only">{caption}</caption>
        <thead><tr><th className="border-b border-tint-border p-2">{xKey}</th>{series.map((entry) => <th key={entry.key} className="border-b border-tint-border p-2">{entry.label}</th>)}</tr></thead>
        <tbody>{data.map((datum, index) => <tr key={index}><td className="border-b border-tint-border p-2">{xFormatter?.(datum[xKey], datum) ?? String(datum[xKey] ?? '')}</td>{series.map((entry) => <td key={entry.key} className="border-b border-tint-border p-2">{valueFormatter?.(datum[entry.key], datum) ?? String(datum[entry.key] ?? '')}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

function ChartFrame({ kind, data, series, xKey, height, empty = 'No data available.', xFormatter, valueFormatter, tableCaption = 'Chart data', showTable = true, className, ...props }: ChartProps & { kind: 'line' | 'bar' }) {
  if (data.length === 0 || series.length === 0) return <div className={cn('grid min-h-40 place-items-center text-sm text-tint-muted', className)} {...props}>{empty}</div>
  const engineProps = { data, series, xKey, height, xFormatter, valueFormatter }
  return (
    <div data-tint-chart={kind} className={cn('grid gap-3', className)} {...props}>
      {kind === 'line' ? <TimeSeriesEngine {...engineProps} /> : <BarEngine {...engineProps} />}
      {showTable ? <details><summary className="cursor-pointer text-xs text-tint-muted">View data table</summary><AccessibleTable {...engineProps} tableCaption={tableCaption} showTable caption={tableCaption} /></details> : null}
    </div>
  )
}

export function TimeSeriesChart(props: ChartProps) { return <ChartFrame kind="line" {...props} /> }
export function BarChart(props: ChartProps) { return <ChartFrame kind="bar" {...props} /> }

export function chartValue(value: unknown): value is ChartDatum[string] {
  return value == null || typeof value === 'string' || typeof value === 'number'
}
