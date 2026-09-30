<script lang="ts">
  import { ReleaseChart, ScatterPlot, type ReleaseScore, type ScatterPoint } from '../svelte'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const releases: ReleaseScore[] = [
    { id: 'Orchid', size: 1.2, score: 84 },
    { id: 'Lantern', size: 2.8, score: 92 },
    { id: 'Harbor', size: 4.1, score: 71 },
    { id: 'Midnight', size: 5.7, score: 96 },
  ]
  const points: ScatterPoint[] = releases.map((row) => ({ id: row.id, label: row.id, x: row.size, y: row.score }))
  let selectedId = $state<string | undefined>()
  const api: ApiRow[] = [
    { prop: 'ReleaseChart.rows', type: 'readonly ReleaseScore[]', description: 'Host-supplied release ID, size in GiB, and policy score.' },
    { prop: 'ScatterPlot.rows', type: 'readonly ScatterPoint[]', description: 'Finite x/y points; invalid values are filtered by pure TypeScript.' },
    { prop: 'label / xLabel / yLabel', type: 'string', description: 'Accessible chart name and axis labels.' },
    { prop: 'selectedId / onSelect', type: 'string / (id) => void', description: 'Optional controlled point activation.' },
    { prop: 'rowLabel / tableCaption / emptyText', type: 'string', description: 'Readable table and empty-state labels.' },
  ]
  const usage = `import { ReleaseChart } from '@nebula/tint/release-chart'
import { ScatterPlot } from '@nebula/tint/scatter-plot'

<ReleaseChart rows={releaseScores} />

let selectedId = $state<string | undefined>()
<ScatterPlot rows={points} label="Tracks by energy and tempo"
  xLabel="Tempo" yLabel="Energy" {selectedId}
  onSelect={(id) => selectedId = id} />`
</script>

<DocPage title="Scatter and Release Charts" description="Small SVG scatter plots over framework-neutral filtering and axis transforms. The matching data table keeps every point readable without relying on color or hover." importPath="@nebula/tint/release-chart" {usage} {api} accessibility="The SVG has an accessible name. A semantic table repeats exact values. Selectable points and table rows are keyboard operable, show visible focus, and report selected state. Invalid numeric values are excluded from both renderings.">
  <div class="charts">
    <div><h3>Release score</h3><ReleaseChart rows={releases} /></div>
    <div><h3>Selectable scatter</h3><ScatterPlot rows={points} label="Demo release scatter" xLabel="Size (GiB)" yLabel="Score" rowLabel="Release" tableCaption="Demo release data" {selectedId} onSelect={(id) => selectedId = id} /><p aria-live="polite">Selected release: {selectedId ?? 'none'}</p></div>
  </div>
</DocPage>

<style>
  .charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; }
  h3 { margin: 0 0 .5rem; color: var(--tint-ink); font-size: .9rem; }
  p { margin: .5rem 0 0; color: var(--tint-muted); font-size: .84rem; }
  @container (max-width: 760px) { .charts { grid-template-columns: 1fr; } }
</style>
