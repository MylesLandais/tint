<script lang="ts">
  import { untrack } from 'svelte'
  import {
    createForceLayout, emptySelection, resolveNodeStatus, stepForceLayout,
    type ForceLayoutOptions, type ForceLayoutState, type GraphSelection, type Point,
  } from '../../../core/graph'
  import type { ForceGraphViewProps } from './types'

  const SETTLED_ENERGY = .05
  const MAX_STEPS = 600
  let { document: graphDocument, selection: selectionProp, runtimeByNodeId, validationByNodeId,
    layout, static: isStatic = false, class: className, className: legacyClassName,
    height = 420, onSelectionChange, onCommand }: ForceGraphViewProps = $props()
  let selection = $derived(selectionProp ?? emptySelection())
  let optionsKey = $derived(JSON.stringify({ width: 800, height, ...layout }))
  let nodeSetKey = $derived(graphDocument.nodes.map((node) => node.id).sort().join('\0'))
  let state = $state<ForceLayoutState>(untrack(() => createForceLayout(graphDocument, JSON.parse(optionsKey) as ForceLayoutOptions)))
  let seededKey = ''
  let seededOptionsKey = ''
  let box = $derived(viewBoxFor(state.positions, JSON.parse(optionsKey) as ForceLayoutOptions))

  $effect(() => {
    const key = nodeSetKey
    const optionValues = optionsKey
    const staticMode = isStatic || prefersReducedMotion()
    if (seededKey === key && seededOptionsKey === optionValues) return
    const options = JSON.parse(optionValues) as ForceLayoutOptions
    const first = seededKey === ''
    seededKey = key
    seededOptionsKey = optionValues
    let next = createForceLayout(graphDocument, options, first ? undefined : untrack(() => state))
    if (staticMode) {
      for (let step = 0; step < (options.iterations ?? MAX_STEPS); step += 1) {
        next = stepForceLayout(next, options)
        if (next.energy < SETTLED_ENERGY) break
      }
    }
    state = next
  })

  $effect(() => {
    const key = nodeSetKey
    const options = JSON.parse(optionsKey) as ForceLayoutOptions
    if (isStatic || prefersReducedMotion()) return
    let frame = 0
    let steps = 0
    const tick = () => {
      const current = state
      if (steps > 0 && current.energy < SETTLED_ENERGY) return
      state = stepForceLayout(current, options)
      steps += 1
      if (steps < MAX_STEPS) frame = requestAnimationFrame(tick)
    }
    if (key !== undefined) frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  })

  function select(nodeId: string, additive: boolean) {
    const nodeIds = new Set(additive ? selection.nodeIds : [])
    if (additive && nodeIds.has(nodeId)) nodeIds.delete(nodeId)
    else nodeIds.add(nodeId)
    const next: GraphSelection = {
      nodeIds, edgeIds: additive ? selection.edgeIds : new Set(),
      groupIds: additive ? selection.groupIds : new Set(),
      primary: nodeIds.has(nodeId) ? { kind: 'node', id: nodeId } : undefined,
    }
    onCommand?.({ type: 'selection.replace', selection: next })
    onSelectionChange?.(next)
  }

  function prefersReducedMotion() {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function viewBoxFor(positions: ReadonlyMap<string, Point>, options: ForceLayoutOptions) {
    const padding = 60
    if (positions.size === 0) return { x: 0, y: 0, width: options.width ?? 800, height: options.height ?? 420 }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const position of positions.values()) {
      minX = Math.min(minX, position.x); minY = Math.min(minY, position.y)
      maxX = Math.max(maxX, position.x); maxY = Math.max(maxY, position.y)
    }
    return { x: minX - padding, y: minY - padding,
      width: Math.max(1, maxX - minX + padding * 2), height: Math.max(1, maxY - minY + padding * 2) }
  }
</script>

<div data-tint-force-graph="" class={['force-graph', className, legacyClassName].filter(Boolean).join(' ')} style:height={`${height}px`}>
  <svg class="canvas" viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`} role="group" aria-label={`Network view, ${graphDocument.nodes.length} nodes`}>
    <g aria-hidden="true">
      {#each graphDocument.edges as edge (edge.id)}
        {@const a = state.positions.get(edge.source.nodeId)}
        {@const b = state.positions.get(edge.target.nodeId)}
        {#if a && b}<line class="edge" data-kind={edge.kind ?? 'edge'} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />{/if}
      {/each}
    </g>
    <g>
      {#each graphDocument.nodes as node (node.id)}
        {@const position = state.positions.get(node.id)}
        {@const status = resolveNodeStatus(validationByNodeId?.get(node.id) ?? [], runtimeByNodeId?.get(node.id))}
        {@const label = node.presentation?.label ?? node.kind}
        {#if position}
          <g class="node" data-kind={node.kind} data-status={status} data-selected={selection.nodeIds.has(node.id)}
            transform={`translate(${position.x} ${position.y})`} role="button" tabindex="0" aria-pressed={selection.nodeIds.has(node.id)}
            aria-label={`${label} (${node.kind}, ${status})`}
            onclick={(event) => select(node.id, event.shiftKey || event.metaKey)}
            onkeydown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(node.id, event.shiftKey || event.metaKey) } }}>
            <circle class="dot" r={selection.nodeIds.has(node.id) ? 11 : 8} />
            <text class="label" x="14" y="4">{label}</text>
          </g>
        {/if}
      {/each}
    </g>
  </svg>
</div>

<style>
  .force-graph { min-width: 0; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-panel); }
  .canvas { display: block; width: 100%; height: 100%; }
  .edge { stroke: var(--tint-border-strong); stroke-width: 2; }
  .edge[data-kind='governed_by'] { stroke-dasharray: 4 4; }
  .node { cursor: pointer; }
  .node:focus-visible { outline: none; }
  .dot { fill: var(--tint-accent); stroke: var(--tint-panel); stroke-width: 2; }
  .node[data-status='running'] .dot { fill: var(--tint-info); }
  .node[data-status='succeeded'] .dot { fill: var(--tint-success); }
  .node[data-status='failed'] .dot, .node[data-status='error'] .dot { fill: var(--tint-danger); }
  .node[data-status='warning'] .dot { fill: var(--tint-warning); }
  .node[data-selected='true'] .dot, .node:focus-visible .dot { stroke: var(--tint-accent); stroke-width: 4; }
  .label { fill: var(--tint-ink); font-size: 13px; paint-order: stroke; stroke: var(--tint-panel); stroke-width: 3px; }
</style>
