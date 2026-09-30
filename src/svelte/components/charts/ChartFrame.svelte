<script lang="ts">
  import { buildChartScene, FALLBACK_COLORS, type ChartKind, type ChartDatum } from '../../../core/charts/model'
  import type { ChartProps } from './types'

  type Props = ChartProps & { kind: ChartKind }
  let {
    kind, data, series, xKey, height = 280, empty = 'No data available.',
    xFormatter, valueFormatter, tableCaption = 'Chart data', showTable = true,
    chartLabel, class: className, ...rest
  }: Props = $props()

  let chartWidth = $state(720)
  let scene = $derived(buildChartScene(kind, data, series, xKey, height, chartWidth))
  let label = $derived(chartLabel ?? `${kind === 'line' ? 'Time series' : 'Bar'} chart: ${series.map((entry) => entry.label).join(', ')}`)
  const display = (value: ChartDatum[string], datum: ChartDatum | undefined, formatter?: ChartProps['xFormatter']) =>
    String(formatter?.(value, datum) ?? value ?? '')
  const axisValue = (value: number) => Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(3)))
  const pathFor = (segment: readonly { x: number; y: number }[]) =>
    segment.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ')
  const xVisible = (index: number, total: number) =>
    index === 0 || index === total - 1 || index % Math.max(1, Math.ceil(total / 8)) === 0
  function measure(node: HTMLDivElement) {
    const update = () => {
      const width = node.getBoundingClientRect().width
      if (Number.isFinite(width) && width > 0) chartWidth = width
    }
    update()
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    observer?.observe(node)
    return { destroy: () => observer?.disconnect() }
  }
</script>

{#if data.length === 0 || series.length === 0}
  <div {...rest} class={['grid min-h-40 place-items-center text-sm text-tint-muted', className]}>
    {#if typeof empty === 'function'}{@render empty()}{:else}{empty}{/if}
  </div>
{:else}
  <div {...rest} use:measure data-tint-chart={kind} class={['grid min-w-0 gap-3', className]}>
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${scene.width} ${scene.height}`}
      preserveAspectRatio="xMinYMin meet"
      style={`display:block;width:100%;height:${scene.height}px;overflow:visible`}
    >
      <title>{label}</title>
      {#each scene.yTicks as tick}
        <line x1={scene.plot.left} x2={scene.plot.left + scene.plot.width} y1={tick.y} y2={tick.y} stroke="var(--tint-border)" stroke-dasharray="3 3" />
        <text x={scene.plot.left - 7} y={tick.y + 4} text-anchor="end" fill="var(--tint-muted)" font-size="11">{display(tick.value, undefined, valueFormatter) || axisValue(tick.value)}</text>
      {/each}
      {#if scene.yDomain[0] <= 0 && scene.yDomain[1] >= 0}
        <line x1={scene.plot.left} x2={scene.plot.left + scene.plot.width} y1={scene.zeroY} y2={scene.zeroY} stroke="var(--tint-border-strong)" />
      {/if}
      {#each scene.xTicks as tick, index}
        {#if xVisible(index, scene.xTicks.length)}
          <text x={tick.x} y={scene.plot.top + scene.plot.height + 19} text-anchor="middle" fill="var(--tint-muted)" font-size="11">{display(tick.value, tick.datum, xFormatter)}</text>
        {/if}
      {/each}
      {#each scene.lines as line (line.series.key)}
        {#each line.segments as segment}
          <path d={pathFor(segment)} fill="none" stroke={line.color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          {#each segment as point}
            <circle cx={point.x} cy={point.y} r={data.length < 30 ? 3.5 : 8} fill={data.length < 30 ? line.color : 'transparent'}>
              <title>{line.series.label}: {display(point.value, point.datum, valueFormatter)} at {display(point.datum[xKey], point.datum, xFormatter)}</title>
            </circle>
          {/each}
        {/each}
      {/each}
      {#each scene.bars as item (item.series.key)}
        {#each item.bars as bar}
          <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} fill={item.color} rx="2">
            <title>{item.series.label}: {display(bar.value, bar.datum, valueFormatter)} at {display(bar.datum[xKey], bar.datum, xFormatter)}</title>
          </rect>
        {/each}
      {/each}
    </svg>
    <ul aria-label="Chart series" class="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-xs text-tint-muted">
      {#each series as entry, index (entry.key)}
        <li class="flex items-center gap-1.5"><span aria-hidden="true" class="inline-block size-2.5 rounded-sm" style:background={entry.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}></span>{entry.label}</li>
      {/each}
    </ul>
    {#if showTable}
      <details>
        <summary class="cursor-pointer text-xs text-tint-muted">View data table</summary>
        <div class="overflow-auto">
          <table class="w-full border-collapse text-left text-xs">
            <caption class="sr-only">{tableCaption}</caption>
            <thead><tr><th scope="col" class="border-b border-tint-border p-2">{xKey}</th>{#each series as entry (entry.key)}<th scope="col" class="border-b border-tint-border p-2">{entry.label}</th>{/each}</tr></thead>
            <tbody>
              {#each data as datum, index (index)}
                <tr><td class="border-b border-tint-border p-2">{display(datum[xKey], datum, xFormatter)}</td>{#each series as entry (entry.key)}<td class="border-b border-tint-border p-2">{display(datum[entry.key], datum, valueFormatter)}</td>{/each}</tr>
              {/each}
            </tbody>
          </table>
        </div>
      </details>
    {/if}
  </div>
{/if}
