<script lang="ts">
  import { BarChart, MetricCard, TimeSeriesChart, type ChartDatum, type ChartSeries } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const data: ChartDatum[] = [
    { day: 'Mon', plays: 42, saves: 18 },
    { day: 'Tue', plays: 58, saves: 24 },
    { day: 'Wed', plays: 51, saves: 21 },
    { day: 'Thu', plays: 73, saves: 29 },
    { day: 'Fri', plays: 64, saves: 35 },
  ]
  const series: ChartSeries[] = [
    { key: 'plays', label: 'Plays' },
    { key: 'saves', label: 'Saves' },
  ]
  const api: ApiRow[] = [
    { prop: 'data / series / xKey', type: 'ChartDatum[] / ChartSeries[] / string', description: 'Plain TypeScript rows and series definitions; keys identify values and labels.' },
    { prop: 'height', type: 'number', description: 'SVG height in pixels; width follows the component container.' },
    { prop: 'xFormatter / valueFormatter', type: 'ChartFormatter', description: 'Optional display formatting for axes, tooltips, and data table values.' },
    { prop: 'showTable / tableCaption / chartLabel', type: 'boolean / string / string', description: 'Accessible exact-value table and chart names.' },
    { prop: 'empty', type: 'string | Snippet', description: 'Content displayed when a chart has no data to plot.' },
    { prop: 'MetricCard label / value / hint / trend', type: 'string | number | Snippet', description: 'Compact summary values with optional trend text.' },
    { prop: 'MetricCard icon', type: 'Snippet', description: 'Optional icon rendered with the metric summary.' },
    { prop: 'MetricCard tone', type: "'default' | 'accent' | 'danger' | 'success'", description: 'Semantic emphasis for the metric card.' },
  ]
  const usage = `import { TimeSeriesChart, BarChart, MetricCard } from '@nebula/tint/charts'

<MetricCard label="Plays" value="288" trend={{ direction: 'up', label: '+12% this week' }} />
<TimeSeriesChart {data} {series} xKey="day" chartLabel="Weekly plays and saves" />
<BarChart {data} {series} xKey="day" chartLabel="Daily plays and saves" />`
</script>

<DocPage title="Charts and Metrics" description="Responsive native SVG charts from framework-neutral chart geometry. The data table preserves exact values, while semantic Tint colors keep series readable across themes." importPath="@nebula/tint/charts" {usage} {api} accessibility="Each SVG has an accessible name and a matching table of exact values. Series names appear in text beside their colors. The table can be opened by keyboard, and chart width responds to its container rather than the viewport.">
  <div class="metric-row">
    <MetricCard label="Total plays" value="288" hint="Across five days" trend={{ direction: 'up', label: '+12% this week' }} tone="accent" />
    <MetricCard label="Total saves" value="127" hint="Across five days" trend={{ direction: 'up', label: '+8% this week' }} />
  </div>
  <div class="chart-grid">
    <section><h3>Time series</h3><TimeSeriesChart {data} {series} xKey="day" chartLabel="Weekly plays and saves" tableCaption="Weekly listening data" /></section>
    <section><h3>Bar chart</h3><BarChart {data} {series} xKey="day" chartLabel="Daily plays and saves" tableCaption="Daily listening data" /></section>
  </div>
</DocPage>

<style>
  .metric-row, .chart-grid { display: grid; gap: 1rem; }
  .metric-row { grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 1.5rem; }
  .chart-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  h3 { margin: 0 0 .5rem; color: var(--tint-ink); font-size: .9rem; }
  @container (max-width: 700px) { .chart-grid { grid-template-columns: 1fr; } }
  @container (max-width: 400px) { .metric-row { grid-template-columns: 1fr; } }
</style>
