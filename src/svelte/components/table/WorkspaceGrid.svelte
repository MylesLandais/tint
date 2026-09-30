<script lang="ts">
  import type { Snippet } from 'svelte'
  import {
    applyWorkspaceCommand, compactWorkspaceDocument, workspaceBreakpointFor, workspaceLayoutsEqual,
    type WorkspaceCollisionMode, type WorkspaceCommand, type WorkspaceDocument, type WorkspaceItem,
  } from '../../../core/table/workspaceGrid'

  type Props = {
    document: WorkspaceDocument
    breakpoints?: Readonly<Record<string, number>>
    columns?: Readonly<Record<string, number>>
    rowHeight?: number
    margin?: readonly [number, number]
    collisionMode?: WorkspaceCollisionMode
    disabled?: boolean
    renderItem: Snippet<[WorkspaceItem, string]>
    onDocumentChange: (document: WorkspaceDocument, command: WorkspaceCommand) => void
    class?: string
  }

  let {
    document, breakpoints = { lg: 1200, md: 768, sm: 0 },
    columns = { lg: 12, md: 8, sm: 4 }, rowHeight = 48, margin = [12, 12],
    collisionMode = 'compact', disabled = false, renderItem, onDocumentChange,
    class: className,
  }: Props = $props()

  let root = $state<HTMLDivElement | null>(null)
  let width = $state(0)
  const instructionId = $props.id()
  let breakpoint = $derived(workspaceBreakpointFor(width, breakpoints))
  let columnCount = $derived(columns[breakpoint] ?? 12)
  let items = $derived(document.layouts[breakpoint] ?? document.layouts[Object.keys(document.layouts)[0] ?? ''] ?? [])

  $effect(() => {
    const node = root
    if (!node) return
    const measure = () => { width = node.getBoundingClientRect().width }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  })

  function issue(command: WorkspaceCommand) {
    if (command.type === 'replace-layouts' && workspaceLayoutsEqual(document.layouts, command.layouts)) return
    const next = applyWorkspaceCommand(document, command, { collisionMode, columns })
    if (next !== document) {
      const emitted = collisionMode === 'compact' && command.type !== 'replace-layouts'
        ? compactWorkspaceDocument(next, command.breakpoint, command.itemId) : next
      onDocumentChange(emitted, command)
    }
  }

  function keyboard(event: KeyboardEvent, item: WorkspaceItem) {
    if (disabled || item.static || !event.altKey) return
    const delta = event.shiftKey ? 2 : 1
    const resize = event.ctrlKey
    let command: WorkspaceCommand | null = null
    if (event.key === 'ArrowLeft') command = resize
      ? { type: 'resize', breakpoint, itemId: item.id, w: item.w - delta, h: item.h, baseRevision: document.revision }
      : { type: 'move', breakpoint, itemId: item.id, x: item.x - delta, y: item.y, baseRevision: document.revision }
    if (event.key === 'ArrowRight') command = resize
      ? { type: 'resize', breakpoint, itemId: item.id, w: item.w + delta, h: item.h, baseRevision: document.revision }
      : { type: 'move', breakpoint, itemId: item.id, x: item.x + delta, y: item.y, baseRevision: document.revision }
    if (event.key === 'ArrowUp') command = resize
      ? { type: 'resize', breakpoint, itemId: item.id, w: item.w, h: item.h - delta, baseRevision: document.revision }
      : { type: 'move', breakpoint, itemId: item.id, x: item.x, y: item.y - delta, baseRevision: document.revision }
    if (event.key === 'ArrowDown') command = resize
      ? { type: 'resize', breakpoint, itemId: item.id, w: item.w, h: item.h + delta, baseRevision: document.revision }
      : { type: 'move', breakpoint, itemId: item.id, x: item.x, y: item.y + delta, baseRevision: document.revision }
    if (command) { event.preventDefault(); issue(command) }
  }

  function pointer(event: PointerEvent, item: WorkspaceItem, axis: 'move' | 'resize') {
    if (disabled || item.static || !width) return
    event.preventDefault()
    const node = event.currentTarget as HTMLElement
    const startX = event.clientX
    const startY = event.clientY
    const cellWidth = (width - margin[0] * (columnCount - 1)) / columnCount + margin[0]
    const cellHeight = rowHeight + margin[1]
    node.setPointerCapture?.(event.pointerId)
    const end = (next: PointerEvent) => {
      const dx = Math.round((next.clientX - startX) / cellWidth)
      const dy = Math.round((next.clientY - startY) / cellHeight)
      if (dx || dy) issue(axis === 'move'
        ? { type: 'move', breakpoint, itemId: item.id, x: item.x + dx, y: item.y + dy, baseRevision: document.revision }
        : { type: 'resize', breakpoint, itemId: item.id, w: item.w + dx, h: item.h + dy, baseRevision: document.revision })
      node.releasePointerCapture?.(next.pointerId)
      node.removeEventListener('pointerup', end)
      node.removeEventListener('pointercancel', end)
    }
    node.addEventListener('pointerup', end)
    node.addEventListener('pointercancel', end)
  }
</script>

<div bind:this={root} data-tint-workspace-grid="" data-breakpoint={breakpoint} class={className}>
  <p id={instructionId} class="sr-only">Use Alt plus arrow keys to move a focused item. Add Control to resize; add Shift for larger steps.</p>
  <div class="grid" style:grid-template-columns={`repeat(${columnCount}, minmax(0, 1fr))`} style:grid-auto-rows={`${rowHeight}px`} style:column-gap={`${margin[0]}px`} style:row-gap={`${margin[1]}px`}>
    {#each items as item (item.id)}
      <section data-workspace-item={item.id} style:grid-column={`${item.x + 1} / span ${item.w}`} style:grid-row={`${item.y + 1} / span ${item.h}`}>
        {#if !disabled && !item.static}
          <button type="button" class="move-handle" aria-label={`Workspace item ${item.id}`} aria-describedby={instructionId} onkeydown={(event) => keyboard(event, item)} onpointerdown={(event) => pointer(event, item, 'move')}>Move {item.id}</button>
        {/if}
        <div class="content">{@render renderItem(item, breakpoint)}</div>
        {#if !disabled && !item.static}
          <button type="button" class="resize-handle" aria-label={`Resize workspace item ${item.id}`} onkeydown={(event) => keyboard(event, item)} onpointerdown={(event) => pointer(event, item, 'resize')}>Resize</button>
        {/if}
      </section>
    {/each}
  </div>
</div>

<style>
  [data-tint-workspace-grid] { min-width: 0; }
  .grid { display: grid; min-width: 0; }
  section { position: relative; min-width: 0; min-height: 0; overflow: auto; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); }
  .content { min-width: 0; }
  .move-handle { display: block; width: 100%; min-height: 1.5rem; border: 0; border-bottom: 1px solid var(--tint-border); background: var(--tint-surface); color: var(--tint-muted); text-align: left; cursor: grab; font: inherit; font-size: var(--tint-font-size-xs); }
  .move-handle:active { cursor: grabbing; }
  .resize-handle { position: absolute; right: 0; bottom: 0; min-width: 2.75rem; min-height: 1.5rem; border: 0; border-top-left-radius: var(--tint-radius-sm); background: var(--tint-surface); color: var(--tint-muted); cursor: nwse-resize; font: inherit; font-size: var(--tint-font-size-xs); }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: -2px; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
</style>
