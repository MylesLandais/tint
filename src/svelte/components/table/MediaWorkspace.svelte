<script lang="ts">
  import { filterMediaReleases, type MediaRelease } from '../../../core/table/mediaWorkspace'
  import DataTable from './DataTable.svelte'
  import type { TableColumn } from './types'

  type Props = {
    title: string
    posterSrc?: string
    releases: readonly MediaRelease[]
    query: string
    onQueryChange: (query: string) => void
    selection: readonly string[]
    onSelectionChange: (selection: readonly string[]) => void
    onQueuePreview?: (selectedIds: readonly string[]) => void
    class?: string
  }

  let {
    title, posterSrc, releases, query, onQueryChange, selection, onSelectionChange,
    onQueuePreview, class: className,
  }: Props = $props()
  const searchId = $props.id()

  const columns: readonly TableColumn<MediaRelease>[] = [
    { id: 'title', header: 'Release', hideable: false, width: 320 },
    { id: 'indexer', header: 'Indexer' },
    { id: 'size', header: 'Size' },
    { id: 'peers', header: 'Peers', type: 'number' },
    { id: 'age', header: 'Age' },
    { id: 'score', header: 'Score', type: 'number' },
  ]
  let filtered = $derived(filterMediaReleases(releases, query))
</script>

<div data-media-workspace="" class={className}>
  <div class="layout">
  <aside class="sidebar">
    <div class="brand">gateway.<small>MEDIA WORKSPACE</small></div>
    <label for={searchId}>Search
      <input id={searchId} type="search" value={query} oninput={(event) => onQueryChange(event.currentTarget.value)} placeholder="Search media" />
    </label>
    <nav aria-label="Workspace"><a href="#media">Movies</a><a href="#releases">Releases</a></nav>
  </aside>
  <main id="media">
    <div class="breadcrumb">Media / Search</div>
    <section class="hero" aria-label={title}>
      {#if posterSrc}<img src={posterSrc} alt={`${title} poster`} />{/if}
      <div><div class="eyebrow">YOUR MEDIA, IN ONE PLACE</div><h2>Find your next release</h2><p>{title} is ready to evaluate across your connected indexers. Compare quality, peers, age, and policy score before adding it to the queue.</p></div>
    </section>
    <section id="releases" class="releases" aria-label="Releases">
      <header>
        <div><h3>Releases</h3><p>{filtered.length} results</p></div>
        <button type="button" disabled={!selection.length || !onQueuePreview} onclick={() => onQueuePreview?.(selection)}>{selection.length ? `Add ${selection.length} to preview queue` : 'Add to preview queue'}</button>
      </header>
      <DataTable rows={filtered} {columns} rowId="id" label="Available releases" rowHeaderColumn="title" {selection} onSelectionChange={(change) => onSelectionChange(change.selection)} selectionLabel={(release) => release.title} />
      <footer>{selection.length} selected · {filtered.length} results</footer>
    </section>
  </main>
  </div>
</div>

<style>
  [data-media-workspace] { container-type: inline-size; min-width: 0; }
  .layout { display: grid; gap: var(--tint-space-4); min-width: 0; }
  .sidebar, .hero, .releases { min-width: 0; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-panel); }
  .sidebar { display: grid; align-content: start; gap: var(--tint-space-4); padding: var(--tint-space-4); }
  .brand { color: var(--tint-ink); font-size: var(--tint-font-size-lg); font-weight: 600; }
  .brand small { display: block; color: var(--tint-muted); font-size: 0.625rem; letter-spacing: 0.2em; }
  .sidebar label { display: grid; gap: var(--tint-space-1); color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  input { min-height: 2.25rem; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-surface); padding: 0 var(--tint-space-2); color: var(--tint-ink); font: inherit; }
  input:focus-visible, button:focus-visible, a:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: 2px; }
  nav { display: grid; gap: var(--tint-space-1); }
  nav a { color: var(--tint-ink); font-size: var(--tint-font-size-sm); text-decoration: none; }
  main { display: grid; min-width: 0; gap: var(--tint-space-3); }
  .breadcrumb { color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .hero { display: flex; gap: var(--tint-space-4); padding: var(--tint-space-4); }
  .hero img { width: 9rem; aspect-ratio: 2 / 3; border-radius: var(--tint-radius-sm); object-fit: cover; }
  .eyebrow { color: var(--tint-accent); font-size: var(--tint-font-size-xs); font-weight: 600; letter-spacing: 0.1em; }
  h2, h3, p { margin: 0; }
  h2 { margin-top: var(--tint-space-2); color: var(--tint-ink); font-size: var(--tint-font-size-xl); }
  .hero p { margin-top: var(--tint-space-2); color: var(--tint-muted); font-size: var(--tint-font-size-sm); line-height: 1.5; }
  .releases { overflow: hidden; }
  .releases header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--tint-space-2); border-bottom: 1px solid var(--tint-border); padding: var(--tint-space-3); }
  .releases h3 { color: var(--tint-ink); font-size: var(--tint-font-size-md); }
  .releases header p, .releases footer { color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  .releases header button { min-height: 2rem; border: 0; border-radius: var(--tint-radius-sm); background: var(--tint-accent); padding: 0 var(--tint-space-3); color: var(--tint-on-accent); cursor: pointer; font: inherit; font-size: var(--tint-font-size-xs); }
  .releases header button:disabled { cursor: not-allowed; opacity: 0.5; }
  .releases footer { border-top: 1px solid var(--tint-border); padding: var(--tint-space-2) var(--tint-space-3); }
  @container (min-width: 760px) { .layout { grid-template-columns: 13.75rem minmax(0, 1fr); } }
</style>
