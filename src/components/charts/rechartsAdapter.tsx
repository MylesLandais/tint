import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ChartProps } from './types'

const FALLBACK_COLORS = ['var(--tint-accent)', 'var(--tint-info)', 'var(--tint-success)', 'var(--tint-warning)', 'var(--tint-danger)']

type AdapterProps = Pick<ChartProps, 'data' | 'series' | 'xKey' | 'height' | 'xFormatter' | 'valueFormatter'>

export function TimeSeriesEngine({ data, series, xKey, height = 280, xFormatter, valueFormatter }: AdapterProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={[...data]} accessibilityLayer>
        <CartesianGrid stroke="var(--tint-border)" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tickFormatter={(value) => String(xFormatter?.(value) ?? value)} />
        <YAxis tickFormatter={(value) => String(valueFormatter?.(value) ?? value)} />
        <Tooltip formatter={(value) => String(valueFormatter?.(typeof value === 'number' || typeof value === 'string' ? value : null) ?? value)} />
        <Legend />
        {series.map((entry, index) => <Line key={entry.key} type="monotone" dataKey={entry.key} name={entry.label} stroke={entry.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]} dot={data.length < 30} isAnimationActive={false} />)}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

export function BarEngine({ data, series, xKey, height = 280, xFormatter, valueFormatter }: AdapterProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={[...data]} accessibilityLayer>
        <CartesianGrid stroke="var(--tint-border)" strokeDasharray="3 3" />
        <XAxis dataKey={xKey} tickFormatter={(value) => String(xFormatter?.(value) ?? value)} />
        <YAxis tickFormatter={(value) => String(valueFormatter?.(value) ?? value)} />
        <Tooltip formatter={(value) => String(valueFormatter?.(typeof value === 'number' || typeof value === 'string' ? value : null) ?? value)} />
        <Legend />
        {series.map((entry, index) => <Bar key={entry.key} dataKey={entry.key} name={entry.label} stackId={entry.stackId} fill={entry.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]} isAnimationActive={false} />)}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
