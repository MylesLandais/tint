<script lang="ts">
  import { graphDocumentFromTrace, runtimeByService } from '../../../core/telemetry/serviceMap'
  import type { GraphEdge, GraphNode } from '../../../core/graph/document'
  import type { TraceServiceMapProps } from './types'

  let { trace, selectedService, onSelectedServiceChange,
    class: className, className: legacyClassName }: TraceServiceMapProps = $props()
  let uncontrolled = $state<string | null>(null)
  let selected = $derived(selectedService === undefined ? uncontrolled : selectedService)
  let document = $derived(graphDocumentFromTrace(trace))
  let runtime = $derived(runtimeByService(trace))
  let selectedNode = $derived(document.nodes.find((node) => node.id === selected) ?? null)
  let canvasWidth = $derived(Math.max(400, ...document.nodes.map((node) => node.position.x + 228)))
  let canvasHeight = $derived(Math.max(180, ...document.nodes.map((node) => node.position.y + 112)))

  function selectService(next: string | null) {
    if (selectedService === undefined) uncontrolled = next
    onSelectedServiceChange?.(next)
  }

  function edgePath(edge: GraphEdge, nodes: readonly GraphNode[]): string {
    const source = nodes.find((node) => node.id === edge.source.nodeId)
    const target = nodes.find((node) => node.id === edge.target.nodeId)
    if (!source || !target) return ''
    const startX = source.position.x + 200
    const startY = source.position.y + 42
    if (target.position.x <= source.position.x) {
      const endX = target.position.x + 200
      const endY = target.position.y + 42
      return `M ${startX} ${startY} C ${startX + 64} ${startY}, ${endX + 64} ${endY}, ${endX} ${endY}`
    }
    const endX = target.position.x
    const endY = target.position.y + 42
    return `M ${startX} ${startY} C ${startX + 44} ${startY}, ${endX - 44} ${endY}, ${endX} ${endY}`
  }
</script>

<section data-trace-service-map="" aria-label={`Service topology for ${trace.name}`}
  class={['tint-trace-service-map', className, legacyClassName].filter(Boolean).join(' ')}>
  <header><h3>Service map</h3><span>{document.nodes.length} {document.nodes.length === 1 ? 'service' : 'services'}</span></header>
  {#if document.nodes.length === 0}
    <p class="empty">No services in this trace.</p>
  {:else}
    <div class="canvas-scroll">
      <div class="canvas" style:width={`${canvasWidth}px`} style:height={`${canvasHeight}px`}>
        <svg class="edges" viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} aria-hidden="true">
          {#each document.edges as edge (edge.id)}
            <path d={edgePath(edge, document.nodes)} fill="none" stroke="var(--tint-border-strong)" stroke-width="2" />
          {/each}
        </svg>
        {#each document.nodes as node (node.id)}
          {@const failed = runtime.get(node.id)?.status === 'failed'}
          <button type="button" class="node" class:failed class:selected={selected === node.id}
            style:left={`${node.position.x}px`} style:top={`${node.position.y}px`}
            aria-pressed={selected === node.id}
            aria-label={`${node.presentation?.label ?? node.id}: ${node.presentation?.description ?? ''}${failed ? ', failed spans' : ''}`}
            onclick={() => selectService(node.id)}>
            <strong>{node.presentation?.label ?? node.id}</strong>
            <span>{node.presentation?.description ?? ''}</span>
            {#if failed}<small>Errors</small>{/if}
          </button>
        {/each}
      </div>
    </div>
    <div class="inspector" aria-live="polite">
      {#if selectedNode}
        <div><strong>{selectedNode.presentation?.label ?? selectedNode.id}</strong><p>{selectedNode.presentation?.description ?? ''} · {runtime.get(selectedNode.id)?.status === 'failed' ? 'Failed spans present' : 'No failed spans'}</p></div>
        <button type="button" class="clear" onclick={() => selectService(null)}>Clear selection</button>
      {:else}
        <p>Select a service to inspect its trace summary.</p>
      {/if}
    </div>
    <details class="connections"><summary>Service calls ({document.edges.length})</summary>
      <ul>
        {#each document.edges as edge (edge.id)}
          <li>{edge.source.nodeId} → {edge.target.nodeId} ({String(edge.metadata?.count ?? 1)})</li>
        {/each}
      </ul>
    </details>
  {/if}
</section>

<style>
  .tint-trace-service-map { display: flex; min-width: 0; height: 28rem; flex-direction: column; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); color: var(--tint-ink); }
  header { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .5rem .75rem; border-bottom: 1px solid var(--tint-border); }
  h3 { margin: 0; font-size: var(--tint-font-size-sm); }
  header span { color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .empty { padding: 1rem; color: var(--tint-muted); font-size: var(--tint-font-size-sm); }
  .canvas-scroll { flex: 1; min-height: 0; overflow: auto; background: var(--tint-surface); }
  .canvas-scroll:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: -2px; }
  .canvas { position: relative; }
  .edges { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .node { position: absolute; display: flex; width: 200px; height: 84px; flex-direction: column; align-items: flex-start; justify-content: center; gap: .125rem; overflow: hidden; padding: .5rem .75rem; border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-md); background: var(--tint-panel); box-shadow: 0 2px 8px rgb(0 0 0 / .08); color: inherit; font: inherit; text-align: left; cursor: pointer; }
  .node:hover, .node.selected { border-color: var(--tint-accent); background: var(--tint-accent-soft); }
  .node.failed { border-color: var(--tint-danger); }
  .node:focus-visible, .clear:focus-visible { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  .node strong, .node span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .node strong { font-size: var(--tint-font-size-sm); }
  .node span, .node small { color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .node small { color: var(--tint-danger-ink); }
  .inspector { display: flex; min-height: 3.5rem; align-items: center; justify-content: space-between; gap: .75rem; padding: .5rem .75rem; border-top: 1px solid var(--tint-border); }
  .inspector strong { font-size: var(--tint-font-size-sm); }
  .inspector p { margin: 0; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .clear { flex: none; padding: .25rem .5rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); color: var(--tint-ink); font: inherit; font-size: var(--tint-font-size-xs); cursor: pointer; }
  .connections { max-height: 7rem; overflow: auto; border-top: 1px solid var(--tint-border); color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  summary { padding: .375rem .75rem; cursor: pointer; }
  ul { margin: 0; padding: 0 .75rem .5rem 2rem; }
</style>
