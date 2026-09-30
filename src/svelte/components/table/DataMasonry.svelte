<script lang="ts" generics="TRow">
  import type { Snippet } from 'svelte'
  import type { TableInstance } from '../../../core/table/engine'
  import { columnsFor, placeMasonryItems, type MasonryDensity } from '../../../core/table/masonry'
  import type { TableRowId } from '../../../core/table/types'

  type Props<TRow> = {
    rows?: readonly TRow[]
    table?: TableInstance<TRow>
    tableVersion?: number
    rowId: (keyof TRow & string) | ((row: TRow) => TableRowId)
    renderItem: Snippet<[TRow]>
    density?: MasonryDensity
    gap?: number
    targetWidth?: number
    emptyState?: Snippet
    footer?: Snippet
    label?: string
    class?: string
  }

  let {
    rows: rowsProp, table, tableVersion, rowId, renderItem,
    density = 'auto', gap = 12, targetWidth = 320, emptyState, footer, label,
    class: className,
  }: Props<TRow> = $props()

  let root = $state<HTMLDivElement | null>(null)
  let layoutRevision = $state(0)
  let rows = $derived.by(() => {
    void tableVersion
    return table ? table.getRowModel().rows.map((row) => row.original) : (rowsProp ?? [])
  })
  const idOf = (row: TRow): TableRowId => typeof rowId === 'function' ? rowId(row) : String(row[rowId])

  $effect(() => {
    const node = root
    if (!node) return
    let lastWidth = node.clientWidth
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => {
      if (node.clientWidth === lastWidth) return
      lastWidth = node.clientWidth
      layoutRevision += 1
    })
    observer?.observe(node)
    const loaded = () => { layoutRevision += 1 }
    node.addEventListener('load', loaded, true)
    return () => { observer?.disconnect(); node.removeEventListener('load', loaded, true) }
  })

  $effect(() => {
    void rows
    void layoutRevision
    const node = root
    if (!node || !node.clientWidth) return
    const items = [...node.querySelectorAll<HTMLElement>('[data-masonry-item]')]
    const columns = columnsFor(node.clientWidth, density, targetWidth)
    const itemWidth = (node.clientWidth - gap * (columns - 1)) / columns
    // Batch writes before reads; loading images can change every measured height.
    for (const item of items) { item.style.position = 'absolute'; item.style.width = `${itemWidth}px` }
    const layout = placeMasonryItems(node.clientWidth, items.map((item) => item.offsetHeight), columns, gap)
    items.forEach((item, index) => {
      const position = layout.positions[index]!
      item.style.transform = `translate(${position.x}px, ${position.y}px)`
    })
    node.style.height = `${layout.height}px`
  })
</script>

<div bind:this={root} role="list" aria-label={label} data-masonry="" data-density={density} class={className}>
  {#each rows as row (idOf(row))}
    <div role="listitem" data-masonry-item="" data-row-id={idOf(row)}>{@render renderItem(row)}</div>
  {/each}
</div>
{#if rows.length === 0}<div class="empty">{#if emptyState}{@render emptyState()}{:else}Nothing to show.{/if}</div>{/if}
{@render footer?.()}

<style>
  [data-masonry] { position: relative; width: 100%; }
  .empty { padding: var(--tint-space-6) var(--tint-space-3); color: var(--tint-muted); text-align: center; font-size: var(--tint-font-size-sm); }
</style>
