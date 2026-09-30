<script lang="ts">
  import { untrack } from 'svelte'
  import {
    applyCommand, createDefaultGraphNodeRegistry, emptySelection, resolveNodeStatus,
    type GraphCommand, type GraphEdge, type GraphNode, type GraphSelection, type GraphViewport, type Point,
  } from '../../../core/graph'
  import NodeInspector from './NodeInspector.svelte'
  import type { InteractiveGraphViewProps } from './types'

  let {
    document: graphDocument, registry: registryProp, readonly = false,
    selection: controlledSelection, validationByNodeId, runtimeByNodeId,
    viewport, class: className, className: legacyClassName,
    showInspector = true, showFullscreenControl = true, nodeRenderers, inspectorRenderers,
    onDocumentChange, onSelectionChange, onViewportChange, onCommand,
  }: InteractiveGraphViewProps = $props()

  let registry = $derived(registryProp ?? createDefaultGraphNodeRegistry())
  const isControlled = untrack(() => controlledSelection !== undefined)
  let internalSelection = $state<GraphSelection>(emptySelection())
  let selection = $derived(isControlled ? controlledSelection ?? emptySelection() : internalSelection)
  let camera = $state<GraphViewport>({ x: 0, y: 0, zoom: 1 })
  let canvasSize = $state({ width: 800, height: 500 })
  let dragPositions = $state<Record<string, Point>>({})
  let pendingPort = $state<{ nodeId: string; portId: string } | null>(null)
  let isFullscreen = $state(false)
  let theaterMode = $state(false)
  let compact = $state(false)
  let rootElement: HTMLDivElement | null = null
  let canvasElement: HTMLDivElement | null = null
  let formerFocus: HTMLElement | null = null
  let pan: { id: number; x: number; y: number; camera: GraphViewport; moved: boolean } | null = null
  let nodeDrag: { id: number; nodeId: string; x: number; y: number; origin: Point; moved: boolean } | null = null
  let suppressNodeClick: string | null = null
  let focusedNodeId = $state<string | null>(null)
  let lastGraphId = ''
  let lastFollowKey = ''
  let cameraInteracted = false
  const helpId = $props.id()

  let positionedNodes = $derived(graphDocument.nodes.map((node) => ({ node, position: dragPositions[node.id] ?? node.position })))
  let byId = $derived(new Map(positionedNodes.map((entry) => [entry.node.id, entry])))
  let worldWidth = $derived(Math.max(1600, ...positionedNodes.map(({ node, position }) => position.x + (node.size?.width ?? 210) + 100)))
  let worldHeight = $derived(Math.max(1000, ...positionedNodes.map(({ node, position }) => position.y + (node.size?.height ?? 110) + 100)))
  let selectedNodes = $derived(graphDocument.nodes.filter((node) => selection.nodeIds.has(node.id)))
  let selectedEdges = $derived(graphDocument.edges.filter((edge) => selection.edgeIds.has(edge.id)))

  function fitCamera(): GraphViewport {
    if (graphDocument.nodes.length === 0) return { x: 0, y: 0, zoom: 1 }
    const minX = Math.min(...graphDocument.nodes.map((node) => node.position.x))
    const minY = Math.min(...graphDocument.nodes.map((node) => node.position.y))
    const maxX = Math.max(...graphDocument.nodes.map((node) => node.position.x + (node.size?.width ?? 210)))
    const maxY = Math.max(...graphDocument.nodes.map((node) => node.position.y + (node.size?.height ?? 110)))
    const zoom = Math.max(.25, Math.min(2, (canvasSize.width - 64) / Math.max(1, maxX - minX), (canvasSize.height - 64) / Math.max(1, maxY - minY)))
    return { x: (canvasSize.width - (maxX - minX) * zoom) / 2 - minX * zoom,
      y: (canvasSize.height - (maxY - minY) * zoom) / 2 - minY * zoom, zoom }
  }

  $effect(() => {
    if (graphDocument.id === lastGraphId) return
    lastGraphId = graphDocument.id
    cameraInteracted = false
    camera = graphDocument.viewport ? { ...graphDocument.viewport } : fitCamera()
    dragPositions = {}
    pendingPort = null
    if (!isControlled) internalSelection = emptySelection()
  })

  $effect(() => {
    const follow = viewport
    if (!follow) { lastFollowKey = ''; return }
    const key = `${follow.x}:${follow.y}:${follow.zoom}`
    if (key === lastFollowKey) return
    lastFollowKey = key
    camera = { ...follow }
  })

  function dispatch(command: GraphCommand) {
    if (command.type === 'selection.replace') {
      if (!isControlled) internalSelection = command.selection
      onSelectionChange?.(command.selection)
    }
    onCommand?.(command)
    if (!onDocumentChange) return
    const next = applyCommand(graphDocument, command, registry)
    if (next !== graphDocument) onDocumentChange(next)
  }

  function changeSelection(next: GraphSelection) {
    dispatch({ type: 'selection.replace', selection: next })
  }

  function selectNode(nodeId: string, additive = false) {
    const nodeIds = new Set(additive ? selection.nodeIds : [])
    if (additive && nodeIds.has(nodeId)) nodeIds.delete(nodeId)
    else nodeIds.add(nodeId)
    changeSelection({ nodeIds, edgeIds: additive ? selection.edgeIds : new Set(),
      groupIds: additive ? selection.groupIds : new Set(),
      primary: nodeIds.has(nodeId) ? { kind: 'node', id: nodeId } : undefined })
  }

  function selectEdge(edgeId: string, additive = false) {
    const edgeIds = new Set(additive ? selection.edgeIds : [])
    if (additive && edgeIds.has(edgeId)) edgeIds.delete(edgeId)
    else edgeIds.add(edgeId)
    changeSelection({ nodeIds: additive ? selection.nodeIds : new Set(), edgeIds,
      groupIds: additive ? selection.groupIds : new Set(),
      primary: edgeIds.has(edgeId) ? { kind: 'edge', id: edgeId } : undefined })
  }

  function commitCamera(next: GraphViewport) {
    cameraInteracted = true
    camera = next
    onViewportChange?.(next)
    dispatch({ type: 'viewport.set', viewport: next })
  }

  function zoomAt(factor: number, x = canvasSize.width / 2, y = canvasSize.height / 2) {
    const zoom = Math.min(2, Math.max(.25, camera.zoom * factor))
    if (zoom === camera.zoom) return
    const ratio = zoom / camera.zoom
    commitCamera({ x: x - (x - camera.x) * ratio, y: y - (y - camera.y) * ratio, zoom })
  }

  function wheel(event: WheelEvent) {
    event.preventDefault()
    const rect = canvasElement?.getBoundingClientRect()
    if (!rect) return
    zoomAt(event.deltaY < 0 ? 1.1 : 1 / 1.1, event.clientX - rect.left, event.clientY - rect.top)
  }

  function startPan(event: PointerEvent) {
    if (event.button !== 0 || !(event.target instanceof Element)) return
    if (event.target.closest('button, .edge-hit')) return
    pan = { id: event.pointerId, x: event.clientX, y: event.clientY, camera: { ...camera }, moved: false }
    canvasElement?.setPointerCapture?.(event.pointerId)
  }

  function movePan(event: PointerEvent) {
    if (!pan || event.pointerId !== pan.id) return
    const dx = event.clientX - pan.x
    const dy = event.clientY - pan.y
    if (Math.abs(dx) + Math.abs(dy) > 2) pan.moved = true
    camera = { ...pan.camera, x: pan.camera.x + dx, y: pan.camera.y + dy }
  }

  function stopPan(event: PointerEvent) {
    if (!pan || event.pointerId !== pan.id) return
    const moved = pan.moved
    pan = null
    canvasElement?.releasePointerCapture?.(event.pointerId)
    if (moved) commitCamera(camera)
    else changeSelection(emptySelection())
  }

  function startNodeDrag(event: PointerEvent, node: GraphNode) {
    event.stopPropagation()
    if (event.button !== 0 || readonly || node.capabilities?.movable === false) return
    nodeDrag = { id: event.pointerId, nodeId: node.id, x: event.clientX, y: event.clientY,
      origin: { ...node.position }, moved: false }
    ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  }

  function moveNode(event: PointerEvent) {
    if (!nodeDrag || event.pointerId !== nodeDrag.id) return
    const dx = (event.clientX - nodeDrag.x) / camera.zoom
    const dy = (event.clientY - nodeDrag.y) / camera.zoom
    if (Math.abs(dx) + Math.abs(dy) > 2) nodeDrag.moved = true
    if (!nodeDrag.moved) return
    dragPositions = { ...dragPositions, [nodeDrag.nodeId]: { x: nodeDrag.origin.x + dx, y: nodeDrag.origin.y + dy } }
  }

  function stopNodeDrag(event: PointerEvent) {
    if (!nodeDrag || event.pointerId !== nodeDrag.id) return
    const { nodeId, moved } = nodeDrag
    nodeDrag = null
    ;(event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId)
    if (!moved) return
    const position = dragPositions[nodeId]
    dragPositions = {}
    suppressNodeClick = nodeId
    if (position) dispatch({ type: 'node.move', nodeIds: [nodeId], positions: { [nodeId]: position } })
  }

  function nodeKeydown(event: KeyboardEvent, node: GraphNode) {
    if (event.key === 'Backspace' || event.key === 'Delete') {
      if (readonly || node.capabilities?.deletable === false) return
      event.preventDefault()
      dispatch({ type: 'entity.delete', entities: [{ kind: 'node', id: node.id }] })
      return
    }
    const delta = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key]
    if (!delta || readonly || node.capabilities?.movable === false) return
    event.preventDefault()
    dispatch({ type: 'node.move', nodeIds: [node.id], positions: { [node.id]: {
      x: node.position.x + delta[0]!, y: node.position.y + delta[1]!,
    } } })
  }

  function customNodeKeydown(event: KeyboardEvent, node: GraphNode) {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      selectNode(node.id, event.shiftKey || event.metaKey)
      return
    }
    nodeKeydown(event, node)
  }

  function customNodePointerDown(event: PointerEvent, node: GraphNode) {
    if ((event.target as Element).closest('button, input, select, textarea, a')) return
    startNodeDrag(event, node)
  }

  function customNodeClick(event: MouseEvent, node: GraphNode) {
    if ((event.target as Element).closest('button, input, select, textarea, a')) return
    if (suppressNodeClick === node.id) { suppressNodeClick = null; return }
    selectNode(node.id, event.shiftKey || event.metaKey)
  }

  function portClick(node: GraphNode, portId: string, direction: 'source' | 'target') {
    if (readonly || node.capabilities?.connectable === false) return
    if (direction === 'source') { pendingPort = { nodeId: node.id, portId }; return }
    if (!pendingPort || pendingPort.nodeId === node.id) return
    dispatch({ type: 'edge.connect', source: pendingPort, target: { nodeId: node.id, portId } })
    pendingPort = null
  }

  function edgePath(edge: GraphEdge): string {
    const from = byId.get(edge.source.nodeId)
    const to = byId.get(edge.target.nodeId)
    if (!from || !to) return ''
    const x1 = from.position.x + (from.node.size?.width ?? 210)
    const y1 = from.position.y + (from.node.size?.height ?? 110) / 2
    const x2 = to.position.x
    const y2 = to.position.y + (to.node.size?.height ?? 110) / 2
    const bend = Math.max(40, Math.abs(x2 - x1) / 2)
    return `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`
  }

  function rootAction(node: HTMLDivElement) {
    rootElement = node
    const updateCompact = () => { compact = node.getBoundingClientRect().width < 768 }
    updateCompact()
    const sizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(updateCompact)
    sizeObserver?.observe(node)
    const fullscreenChange = () => {
      if (document.fullscreenElement === node) { isFullscreen = true; theaterMode = false }
      else if (!theaterMode) isFullscreen = false
    }
    const keydown = (event: KeyboardEvent) => {
      if (!isFullscreen || !node.contains(document.activeElement)) return
      if (event.key === 'Escape') { event.preventDefault(); void exitFullscreen(); return }
      if (theaterMode && event.key === 'Tab') {
        const focusables = [...node.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')]
        const first = focusables[0], last = focusables.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('fullscreenchange', fullscreenChange)
    document.addEventListener('keydown', keydown)
    return { destroy: () => {
      sizeObserver?.disconnect()
      document.removeEventListener('fullscreenchange', fullscreenChange)
      document.removeEventListener('keydown', keydown)
      if (document.fullscreenElement === node) void document.exitFullscreen()
      rootElement = null
    } }
  }

  function canvasAction(node: HTMLDivElement) {
    canvasElement = node
    const update = () => {
      const rect = node.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        canvasSize = { width: rect.width, height: rect.height }
        if (!graphDocument.viewport && !cameraInteracted) camera = fitCamera()
      }
    }
    update()
    node.addEventListener('wheel', wheel, { passive: false })
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    observer?.observe(node)
    return { destroy: () => { observer?.disconnect(); node.removeEventListener('wheel', wheel); canvasElement = null } }
  }

  async function exitFullscreen() {
    if (document.fullscreenElement === rootElement) {
      try { await document.exitFullscreen() } catch { /* Theater mode still exits. */ }
    }
    isFullscreen = false
    theaterMode = false
    formerFocus?.focus()
  }

  async function toggleFullscreen() {
    if (isFullscreen) { await exitFullscreen(); return }
    formerFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    try {
      if (!rootElement?.requestFullscreen) throw new Error('Fullscreen unavailable')
      await rootElement.requestFullscreen()
      isFullscreen = true
    } catch {
      theaterMode = true
      isFullscreen = true
    }
    rootElement?.focus()
  }
</script>

<div use:rootAction data-tint-graph-view="" data-readonly={readonly} data-fullscreen={isFullscreen} data-theater={theaterMode} data-compact={compact}
  role={theaterMode ? 'dialog' : undefined} aria-modal={theaterMode || undefined}
  aria-label={theaterMode ? 'Graph, fullscreen' : undefined} tabindex="-1"
  class={['graph', theaterMode && 'theater', className, legacyClassName].filter(Boolean).join(' ')}>
  <div use:canvasAction class="canvas" role="application" aria-label="Graph canvas" aria-describedby={helpId}
    onpointerdown={startPan} onpointermove={movePan} onpointerup={stopPan} onpointercancel={stopPan}>
    <p id={helpId} class="sr-only">Press Tab to move between nodes and edges. Arrow keys move a focused node. Enter selects. Drag to pan, scroll to zoom, and press Escape to leave fullscreen.</p>
    <div class="toolbar">
      <button type="button" aria-label="Zoom in" onclick={() => zoomAt(1.2)}>+</button>
      <button type="button" aria-label="Zoom out" onclick={() => zoomAt(1 / 1.2)}>−</button>
      <button type="button" aria-label="Fit graph" onclick={() => commitCamera(fitCamera())}>Fit</button>
      {#if showFullscreenControl}<button type="button" aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} aria-pressed={isFullscreen} onclick={toggleFullscreen}>{isFullscreen ? 'Exit' : 'Fullscreen'}</button>{/if}
    </div>
    <div class="world" style:width={`${worldWidth}px`} style:height={`${worldHeight}px`}
      style:transform={`translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})`}>
      <svg class="edges" width={worldWidth} height={worldHeight} role="group" aria-label="Graph edges">
        {#each graphDocument.edges as edge (edge.id)}
          <path d={edgePath(edge)} class="edge" data-kind={edge.kind ?? 'edge'} data-selected={selection.edgeIds.has(edge.id)} />
          <path d={edgePath(edge)} class="edge-hit" role="button" tabindex="0"
            aria-label={`Edge ${edge.source.nodeId}.${edge.source.portId} to ${edge.target.nodeId}.${edge.target.portId}`}
            aria-pressed={selection.edgeIds.has(edge.id)}
            onclick={(event) => selectEdge(edge.id, event.shiftKey || event.metaKey)}
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectEdge(edge.id, event.shiftKey || event.metaKey) }
              else if ((event.key === 'Delete' || event.key === 'Backspace') && !readonly) {
                event.preventDefault(); dispatch({ type: 'entity.delete', entities: [{ kind: 'edge', id: edge.id }] })
              }
            }} />
        {/each}
      </svg>
      {#each positionedNodes as { node, position } (node.id)}
        {@const status = resolveNodeStatus(validationByNodeId?.get(node.id) ?? [], runtimeByNodeId?.get(node.id))}
        {@const Renderer = nodeRenderers?.get(node.kind)}
        <article class="node" data-graph-node="" data-kind={node.kind} data-status={status} data-selected={selection.nodeIds.has(node.id)}
          style:left={`${position.x}px`} style:top={`${position.y}px`}
          style:width={`${node.size?.width ?? 210}px`} style:height={`${node.size?.height ?? 110}px`}>
          {#if Renderer}
            <div class="node-custom" role="button" tabindex="0" aria-pressed={selection.nodeIds.has(node.id)}
              aria-label={`${node.presentation?.label ?? node.kind} (${node.kind}, ${status})`}
              onpointerdown={(event) => customNodePointerDown(event, node)} onpointermove={moveNode}
              onpointerup={stopNodeDrag} onpointercancel={stopNodeDrag}
              onkeydown={(event) => customNodeKeydown(event, node)}
              onclick={(event) => customNodeClick(event, node)}
              onfocusin={() => focusedNodeId = node.id}
              onfocusout={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focusedNodeId = null }}>
              <Renderer {node} selected={selection.nodeIds.has(node.id)} focused={focusedNodeId === node.id} {readonly}
                validation={validationByNodeId?.get(node.id) ?? []} runtime={runtimeByNodeId?.get(node.id)} {dispatch} />
            </div>
          {:else}
            <button class="node-main" type="button" aria-pressed={selection.nodeIds.has(node.id)}
              aria-label={`${node.presentation?.label ?? node.kind} (${node.kind}, ${status})`}
              onpointerdown={(event) => startNodeDrag(event, node)} onpointermove={moveNode}
              onpointerup={stopNodeDrag} onpointercancel={stopNodeDrag}
              onkeydown={(event) => nodeKeydown(event, node)}
              onclick={(event) => { if (suppressNodeClick === node.id) { suppressNodeClick = null; return } selectNode(node.id, event.shiftKey || event.metaKey) }}>
              <span class="kind">{node.kind} · {status}</span>
              <strong>{node.presentation?.label ?? node.kind}</strong>
              {#if node.presentation?.description}<small>{node.presentation.description}</small>{/if}
              {#if node.kind === 'script' && typeof (node.configuration as Record<string, unknown> | null)?.sourceRef === 'string'}
                <code>{String((node.configuration as Record<string, unknown>).sourceRef)}</code>
              {/if}
            </button>
          {/if}
          {#each node.ports.filter((port) => port.direction !== 'output') as port, index (port.id)}
            <button type="button" class="port input" style:top={`${((index + 1) / (node.ports.filter((candidate) => candidate.direction !== 'output').length + 1)) * 100}%`}
              disabled={readonly || node.capabilities?.connectable === false} aria-label={`${node.presentation?.label ?? node.kind} ${port.key} input`}
              onclick={(event) => { event.stopPropagation(); portClick(node, port.id, 'target') }} title={port.key}></button>
          {/each}
          {#each node.ports.filter((port) => port.direction !== 'input') as port, index (port.id)}
            <button type="button" class="port output" style:top={`${((index + 1) / (node.ports.filter((candidate) => candidate.direction !== 'input').length + 1)) * 100}%`}
              disabled={readonly || node.capabilities?.connectable === false} aria-label={`${node.presentation?.label ?? node.kind} ${port.key} output`}
              aria-pressed={pendingPort?.nodeId === node.id && pendingPort.portId === port.id}
              onclick={(event) => { event.stopPropagation(); portClick(node, port.id, 'source') }} title={port.key}></button>
          {/each}
        </article>
      {/each}
    </div>
  </div>
  {#if showInspector}
    <NodeInspector nodes={selectedNodes} edges={selectedEdges} {registry} {readonly} {validationByNodeId} {runtimeByNodeId} {inspectorRenderers} {dispatch} />
  {/if}
</div>

<style>
  .graph { display: grid; grid-template-columns: minmax(0, 1fr) minmax(15rem, 28%); min-width: 0; min-height: 28rem; height: 100%; overflow: hidden; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-lg); background: var(--tint-surface); color: var(--tint-ink); }
  .graph:not(:has(aside)) { grid-template-columns: 1fr; }
  .graph.theater { position: fixed; z-index: 1000; inset: 0; width: 100vw; height: 100vh; border-radius: 0; }
  .graph:fullscreen { width: 100vw; height: 100vh; border-radius: 0; }
  .canvas { position: relative; min-width: 0; min-height: 28rem; overflow: hidden; touch-action: none; background-color: var(--tint-surface); background-image: radial-gradient(var(--tint-border) 1px, transparent 1px); background-size: 18px 18px; cursor: grab; }
  .canvas:active { cursor: grabbing; }
  .toolbar { position: absolute; z-index: 5; top: .75rem; right: .75rem; display: flex; gap: .25rem; padding: .25rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); box-shadow: 0 2px 6px rgb(0 0 0 / .1); }
  .toolbar button { min-width: 2rem; padding: .25rem .45rem; border: 0; border-radius: var(--tint-radius-sm); background: transparent; color: var(--tint-ink); font: inherit; font-size: .75rem; cursor: pointer; }
  .toolbar button:hover { background: var(--tint-accent-soft); }
  .world { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
  .edges { position: absolute; inset: 0; overflow: visible; }
  .edge { fill: none; stroke: var(--tint-border-strong); stroke-width: 2; pointer-events: none; }
  .edge[data-selected='true'] { stroke: var(--tint-accent); stroke-width: 3; }
  .edge-hit { fill: none; stroke: transparent; stroke-width: 18; cursor: pointer; }
  .edge-hit:focus-visible { stroke: var(--tint-accent-soft); outline: none; }
  .node { position: absolute; border: 1px solid var(--tint-border-strong); border-radius: var(--tint-radius-md); background: var(--tint-panel); box-shadow: 0 2px 8px rgb(0 0 0 / .1); }
  .node[data-selected='true'] { outline: 2px solid var(--tint-accent); }
  .node[data-status='failed'], .node[data-status='error'] { border-color: var(--tint-danger); }
  .node[data-status='warning'] { border-color: var(--tint-warning); }
  .node-main { display: flex; width: 100%; height: 100%; flex-direction: column; align-items: flex-start; gap: .25rem; overflow: hidden; padding: .65rem .75rem; border: 0; border-radius: inherit; background: transparent; color: inherit; font: inherit; text-align: left; cursor: grab; touch-action: none; }
  .node-custom { width: 100%; height: 100%; border-radius: inherit; cursor: grab; touch-action: none; }
  .node-custom:focus-visible { outline: 2px solid var(--tint-focus, var(--tint-accent)); outline-offset: 2px; }
  .node-main:focus-visible, .port:focus-visible, .toolbar button:focus-visible { outline: 2px solid var(--tint-focus, var(--tint-accent)); outline-offset: 2px; }
  .kind { color: var(--tint-muted); font-size: .625rem; text-transform: uppercase; }
  strong { max-width: 100%; overflow: hidden; font-size: .8125rem; text-overflow: ellipsis; white-space: nowrap; }
  small, code { max-width: 100%; overflow: hidden; color: var(--tint-muted); font-size: .6875rem; text-overflow: ellipsis; white-space: nowrap; }
  .port { position: absolute; z-index: 2; width: 14px; height: 14px; padding: 0; border: 2px solid var(--tint-panel); border-radius: 50%; background: var(--tint-accent); transform: translateY(-50%); cursor: crosshair; }
  .port.input { left: -7px; }
  .port.output { right: -7px; }
  .port[aria-pressed='true'] { outline: 2px solid var(--tint-accent); outline-offset: 2px; }
  .port:disabled { cursor: default; opacity: .5; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
  .graph[data-compact='true'] { grid-template-columns: 1fr; grid-template-rows: minmax(20rem, 1fr) minmax(12rem, auto); }
  .graph[data-compact='true'] .canvas { min-height: 20rem; }
</style>
