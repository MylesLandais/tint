<script lang="ts">
  import { onMount } from 'svelte'
  import { createView, type FieldDef, type TableView } from '../../core/table'
  import { DatasetEditor, createDatasetStore, type DatasetStore } from '../../svelte/components/table'

  type Book = Record<string, unknown> & { id: string }
  type Raw = {
    id: string; title: string; authors: string[]; year: number | null; subjects: string[]; pages: number | null
    isbn: string; language: string; editions: number; url: string; rating: number | null; status: string
    owned: boolean; notes: string; shelf: string | null
  }

  const SIZES = [1000, 5000, Number.POSITIVE_INFINITY]
  let size = $state<number>(Number.POSITIVE_INFINITY)
  let raw = $state.raw<{ shelves: { id: string; name: string }[]; books: Raw[] } | null>(null)
  let error = $state('')
  let store = $state.raw<DatasetStore<Book> | null>(null)

  onMount(async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/books.json`)
      if (!res.ok) throw new Error(`Dataset request failed (${res.status})`)
      raw = await res.json()
      build()
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unable to load the dataset'
    }
  })

  const top = (values: string[], n: number) => {
    const counts = new Map<string, number>()
    for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value]) => ({ value }))
  }

  function build() {
    if (!raw) return
    const books = raw.books.slice(0, size)
    const fields: FieldDef[] = [
      { id: 'title', name: 'Title', type: 'text', width: 280 },
      { id: 'authors', name: 'Authors', type: 'text', width: 200 },
      { id: 'status', name: 'Status', type: 'select', options: ['Unread', 'Reading', 'Finished', 'Abandoned'].map((value) => ({ value })) },
      { id: 'rating', name: 'Rating', type: 'rating' },
      { id: 'published', name: 'First published', type: 'date', width: 140 },
      { id: 'subjects', name: 'Subjects', type: 'multi-select', options: top(books.flatMap((b) => b.subjects), 40), width: 260 },
      { id: 'pages', name: 'Pages', type: 'number' },
      { id: 'owned', name: 'Owned', type: 'checkbox' },
      { id: 'shelf', name: 'Shelf', type: 'linked-record', options: raw.shelves.map((s) => ({ value: s.id, label: s.name })) },
      { id: 'language', name: 'Language', type: 'select', options: top(books.map((b) => b.language), 12), width: 120 },
      { id: 'notes', name: 'Notes', type: 'long-text', width: 280 },
      { id: 'link', name: 'Open Library', type: 'url' },
      { id: 'isbn', name: 'ISBN', type: 'text', width: 140 },
      { id: 'editions', name: 'Editions', type: 'number', readOnly: true },
    ]
    const rows: Book[] = books.map((b) => ({
      id: b.id, title: b.title, authors: b.authors.join('; '), status: b.status, rating: b.rating,
      published: b.year == null ? null : String(b.year), subjects: b.subjects, pages: b.pages, owned: b.owned,
      shelf: b.shelf, language: b.language, notes: b.notes, link: b.url, isbn: b.isbn, editions: b.editions,
    }))
    const views: TableView[] = [
      createView('all', 'All books'),
      createView('reading', 'Reading', { filters: [{ id: 'f1', field: 'status', operator: 'equals', value: 'Reading' }], hidden: ['isbn', 'editions', 'language'] }),
      createView('top', 'Top rated', { filters: [{ id: 'f1', field: 'rating', operator: 'gte', value: 4 }], sorts: [{ field: 'rating', desc: true }, { field: 'title', desc: false }], rowHeight: 'medium' }),
      createView('status', 'By status', { groupBy: 'status', hidden: ['notes', 'isbn', 'link'] }),
    ]
    store = createDatasetStore<Book>({ fields, rows, views })
  }
</script>

<div class="demo">
  <div class="meta">
    <p>
      <strong>{store ? store.rows.length.toLocaleString() : '…'} books</strong> from
      <a href="https://openlibrary.org/developers/dumps" target="_blank" rel="noopener noreferrer">Open Library</a> (CC0 metadata).
      Rating, status, shelf, ownership and notes are generated for the demo.
    </p>
    <label>Dataset size
      <select class="tint-select" value={String(size)} onchange={(e) => { size = Number(e.currentTarget.value); build() }} disabled={!raw}>
        {#each SIZES as n (n)}<option value={String(n)}>{Number.isFinite(n) ? `${n.toLocaleString()} rows` : `All ${raw ? raw.books.length.toLocaleString() : ''} rows`}</option>{/each}
      </select>
    </label>
  </div>

  <details class="try">
    <summary>Try it</summary>
    <ol>
      <li>Click a <strong>Title</strong>, then click it again to edit. <kbd>Enter</kbd> saves, <kbd>Esc</kbd> cancels.</li>
      <li>Click a <strong>Status</strong> twice to open the chip menu. Type a new name and choose <em>Create</em>.</li>
      <li>Click a <strong>star</strong> to rate; click the same star to clear.</li>
      <li>Right-click a row to insert, duplicate or delete it, or press <kbd>Tab</kbd> past the last cell to add one.</li>
      <li>Press <kbd>Ctrl</kbd>+<kbd>Z</kbd> to undo any of it. Edits live in memory; reload to reset.</li>
    </ol>
  </details>

  {#if error}
    <p role="alert" class="status error">{error}</p>
  {:else if !store}
    <p role="status" class="status">Loading dataset…</p>
  {:else}
    {#key size}<DatasetEditor {store} label="Books" height={560} />{/key}
  {/if}
</div>

<style>
  .demo { display: grid; gap: 1rem; min-width: 0; }
  .meta { display: flex; flex-wrap: wrap; gap: .5rem 1.5rem; align-items: center; justify-content: space-between; }
  .meta p { margin: 0; font-size: .85rem; color: var(--tint-muted); }
  .meta a { color: var(--tint-accent); }
  label { display: inline-flex; gap: .5rem; align-items: center; font-size: .78rem; color: var(--tint-muted); }
  select { font: inherit; color: var(--tint-ink); background: var(--tint-field); border: 0; border-bottom: 1px solid var(--tint-border-strong); padding: .25rem .5rem; }
  .try { font-size: .85rem; color: var(--tint-muted); }
  .try summary { cursor: pointer; color: var(--tint-ink); font-weight: 600; }
  .try ol { margin: .5rem 0 0; padding-inline-start: 1.25rem; display: grid; gap: .25rem; }
  kbd { font-family: var(--tint-font-mono, ui-monospace, monospace); font-size: .75rem; padding: 0 .3rem; border: 1px solid var(--tint-border-strong); border-radius: 3px; background: var(--tint-field); color: var(--tint-ink); }
  .status { margin: 0; padding: 2rem; text-align: center; color: var(--tint-muted); }
  .error { color: var(--tint-danger-ink); }
</style>
