<script lang="ts">
  import type { Snippet } from 'svelte'
  import { scatterAxis, scatterCoordinates, validScatterRows, type ScatterPoint } from '../../../core/scatter-plot/model'

  type Props = {
    rows: readonly ScatterPoint[]
    label: string
    xLabel: string
    yLabel: string
    rowLabel?: string
    tableCaption?: string
    emptyText?: string | Snippet
    selectedId?: string
    onSelect?: (id: string) => void
    class?: string
  }
  let {
    rows, label, xLabel, yLabel, rowLabel = 'Item', tableCaption = 'Chart data',
    emptyText = 'No valid data available.', selectedId, onSelect, class: className,
  }: Props = $props()
  let data = $derived(validScatterRows(rows))
  let x = $derived(scatterAxis(data.map((row) => row.x)))
  let y = $derived(scatterAxis(data.map((row) => row.y)))
</script>

<div data-tint-scatter-plot="" class={['tint-scatter-plot', className].filter(Boolean).join(' ')}>
  <svg role={onSelect ? 'group' : 'img'} aria-label={label} viewBox="0 0 640 270">
    <path d="M 80 24 V 220 H 610" fill="none" stroke="var(--tint-border)" />
    <g fill="var(--tint-muted)" font-size="12">
      <text x="345" y="260" text-anchor="middle">{xLabel}</text>
      <text transform="translate(18 122) rotate(-90)" text-anchor="middle">{yLabel}</text>
      <text x="80" y="239" text-anchor="middle">{x.min}</text>
      <text x="610" y="239" text-anchor="end">{x.max}</text>
      <text x="70" y="220" text-anchor="end">{y.min}</text>
      <text x="70" y="28" text-anchor="end">{y.max}</text>
    </g>
    {#each data as row, index (`${row.id}:${index}`)}
      {@const point = scatterCoordinates(row, x, y)}
      {#if onSelect}
        <circle
          cx={point.cx} cy={point.cy} r={row.id === selectedId ? 8 : 5}
          fill="var(--tint-accent)" role="button" tabindex="0"
          aria-label={`${row.label ?? row.id}: ${row.x}, ${row.y}`}
          aria-pressed={row.id === selectedId}
          onclick={() => onSelect(row.id)}
          onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(row.id) } }}
        ><title>{row.label ?? row.id}: {row.x}, {row.y}</title></circle>
      {:else}
        <circle cx={point.cx} cy={point.cy} r={row.id === selectedId ? 8 : 5} fill="var(--tint-accent)">
          <title>{row.label ?? row.id}: {row.x}, {row.y}</title>
        </circle>
      {/if}
    {/each}
  </svg>
  {#if data.length === 0}<p class="empty">{#if typeof emptyText === 'string'}{emptyText}{:else}{@render emptyText()}{/if}</p>{/if}
  <div class="table-wrap"><table>
    <caption>{tableCaption}</caption>
    <thead><tr><th scope="col">{rowLabel}</th><th scope="col">{xLabel}</th><th scope="col">{yLabel}</th></tr></thead>
    <tbody>
      {#each data as row, index (`${row.id}:${index}`)}
        <tr>
          <th scope="row">{#if onSelect}<button type="button" aria-pressed={selectedId === row.id} onclick={() => onSelect?.(row.id)}>{row.label ?? row.id}</button>{:else}{row.label ?? row.id}{/if}</th>
          <td>{row.x}</td><td>{row.y}</td>
        </tr>
      {/each}
    </tbody>
  </table></div>
</div>

<style>
  .tint-scatter-plot { width: 100%; min-width: 0; color: var(--tint-ink); container-type: inline-size; }
  svg { display: block; width: 100%; height: auto; }
  circle { cursor: pointer; }
  circle:focus-visible { stroke: var(--tint-focus); stroke-width: 2px; outline: none; }
  .empty { margin: .5rem 0; color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  .table-wrap { max-height: 18rem; overflow: auto; }
  table { width: 100%; border-collapse: collapse; font-size: var(--tint-font-size-xs); text-align: left; }
  caption { padding: .5rem 0; font-weight: 600; text-align: left; }
  th, td { border-bottom: 1px solid var(--tint-border); padding: .375rem .5rem; }
  thead th { position: sticky; top: 0; background: var(--tint-panel); }
  button { border: 0; background: transparent; color: var(--tint-accent); font: inherit; cursor: pointer; }
  button:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  @container (max-width: 26rem) { th, td { padding: .25rem; } }
</style>
