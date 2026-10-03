<script lang="ts">
  import type { FieldDef, RowHeight, TableView, ViewFilter, ViewFilterOperator } from '../../../core/table'

  type Props = {
    fields: readonly FieldDef[]
    views: readonly TableView[]
    view: TableView
    canUndo?: boolean
    canRedo?: boolean
    onSelectView: (id: string) => void
    onUpdateView: (view: TableView) => void
    onAddView?: (name: string) => void
    onRemoveView?: (id: string) => void
    onUndo?: () => void
    onRedo?: () => void
  }
  let { fields, views, view, canUndo = false, canRedo = false, onSelectView, onUpdateView, onAddView, onRemoveView, onUndo, onRedo }: Props = $props()

  type PanelId = 'filter' | 'sort' | 'fields'
  let open = $state<PanelId | null>(null)
  const uid = $props.id()

  const OPERATORS: Record<string, { value: ViewFilterOperator; label: string }[]> = {
    text: [{ value: 'contains', label: 'contains' }, { value: 'equals', label: 'is' }, { value: 'notEquals', label: 'is not' }, { value: 'empty', label: 'is empty' }, { value: 'notEmpty', label: 'is not empty' }],
    number: [{ value: 'equals', label: '=' }, { value: 'gt', label: '>' }, { value: 'gte', label: '≥' }, { value: 'lt', label: '<' }, { value: 'lte', label: '≤' }, { value: 'empty', label: 'is empty' }, { value: 'notEmpty', label: 'is not empty' }],
    choice: [{ value: 'equals', label: 'is' }, { value: 'notEquals', label: 'is not' }, { value: 'contains', label: 'contains' }, { value: 'empty', label: 'is empty' }, { value: 'notEmpty', label: 'is not empty' }],
  }
  const opsFor = (type: string) =>
    OPERATORS[['number', 'rating', 'date'].includes(type) ? 'number' : ['select', 'multi-select', 'linked-record', 'checkbox'].includes(type) ? 'choice' : 'text']
  const fieldOf = (id: string) => fields.find((f) => f.id === id)
  const noValue = (op: ViewFilterOperator) => op === 'empty' || op === 'notEmpty'

  const toggle = (panel: PanelId) => (open = open === panel ? null : panel)
  const patch = (next: Partial<TableView>) => onUpdateView({ ...view, ...next })

  function updateFilter(id: string, change: Partial<ViewFilter>) {
    patch({ filters: view.filters.map((f) => (f.id === id ? { ...f, ...change } : f)) })
  }
  function addFilter() {
    const field = fields[0]
    if (!field) return
    patch({ filters: [...view.filters, { id: `filter-${Date.now().toString(36)}`, field: field.id, operator: opsFor(field.type)[0].value, value: '' }] })
  }
  function addSort() {
    const used = new Set(view.sorts.map((s) => s.field))
    const field = fields.find((f) => !used.has(f.id))
    if (field) patch({ sorts: [...view.sorts, { field: field.id, desc: false }] })
  }
  function toggleHidden(id: string) {
    patch({ hidden: view.hidden.includes(id) ? view.hidden.filter((h) => h !== id) : [...view.hidden, id] })
  }
  function newView() {
    const name = `View ${views.length + 1}`
    onAddView?.(name)
  }
  function tabKey(event: KeyboardEvent, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next = views[(index + (event.key === 'ArrowRight' ? 1 : -1) + views.length) % views.length]
    onSelectView(next.id)
    ;(event.currentTarget as HTMLElement).parentElement?.querySelector<HTMLElement>(`[data-view="${next.id}"]`)?.focus()
  }
</script>

<div class="bar">
  <div class="tabs" role="tablist" aria-label="Views">
    {#each views as v, i (v.id)}
      <button
        type="button" role="tab" data-view={v.id} aria-selected={v.id === view.id} tabindex={v.id === view.id ? 0 : -1}
        onclick={() => onSelectView(v.id)} onkeydown={(e) => tabKey(e, i)}
      >{v.name}</button>
    {/each}
    {#if onAddView}<button type="button" class="plus" aria-label="Create view" onclick={newView}>＋</button>{/if}
    {#if onRemoveView && views.length > 1}<button type="button" class="plus" aria-label={`Delete view ${view.name}`} onclick={() => onRemoveView(view.id)}>🗑</button>{/if}
  </div>

  <div class="tools" role="toolbar" aria-label="View options">
    <button type="button" aria-expanded={open === 'filter'} aria-controls={`${uid}-filter`} data-active={view.filters.length > 0} onclick={() => toggle('filter')}>
      Filter{view.filters.length ? ` · ${view.filters.length}` : ''}
    </button>
    <button type="button" aria-expanded={open === 'sort'} aria-controls={`${uid}-sort`} data-active={view.sorts.length > 0} onclick={() => toggle('sort')}>
      Sort{view.sorts.length ? ` · ${view.sorts.length}` : ''}
    </button>
    <label class="group">Group
      <select class="tint-select" value={view.groupBy ?? ''} onchange={(e) => patch({ groupBy: e.currentTarget.value || undefined })}>
        <option value="">None</option>
        {#each fields as f (f.id)}<option value={f.id}>{f.name}</option>{/each}
      </select>
    </label>
    <button type="button" aria-expanded={open === 'fields'} aria-controls={`${uid}-fields`} data-active={view.hidden.length > 0} onclick={() => toggle('fields')}>
      Fields{view.hidden.length ? ` · ${view.hidden.length} hidden` : ''}
    </button>
    <label class="group">Row height
      <select class="tint-select" value={view.rowHeight} onchange={(e) => patch({ rowHeight: e.currentTarget.value as RowHeight })}>
        <option value="short">Short</option><option value="medium">Medium</option><option value="tall">Tall</option>
      </select>
    </label>
    <span class="spacer"></span>
    <button type="button" disabled={!canUndo} onclick={onUndo} aria-label="Undo">↶ Undo</button>
    <button type="button" disabled={!canRedo} onclick={onRedo} aria-label="Redo">↷ Redo</button>
  </div>

  {#if open === 'filter'}
    <div class="panel" id={`${uid}-filter`} role="group" aria-label="Filters">
      {#each view.filters as f (f.id)}
        {@const field = fieldOf(f.field)}
        <div class="line">
          <select class="tint-select" aria-label="Filter field" value={f.field} onchange={(e) => { const nf = fieldOf(e.currentTarget.value); updateFilter(f.id, { field: e.currentTarget.value, operator: nf ? opsFor(nf.type)[0].value : f.operator }) }}>
            {#each fields as o (o.id)}<option value={o.id}>{o.name}</option>{/each}
          </select>
          <select class="tint-select" aria-label="Filter operator" value={f.operator} onchange={(e) => updateFilter(f.id, { operator: e.currentTarget.value as ViewFilterOperator })}>
            {#each opsFor(field?.type ?? 'text') as op (op.value)}<option value={op.value}>{op.label}</option>{/each}
          </select>
          {#if !noValue(f.operator)}
            <input aria-label="Filter value" value={String(f.value ?? '')} placeholder="Value" oninput={(e) => updateFilter(f.id, { value: e.currentTarget.value })} />
          {/if}
          <button type="button" aria-label="Remove filter" onclick={() => patch({ filters: view.filters.filter((x) => x.id !== f.id) })}>✕</button>
        </div>
      {:else}
        <p class="empty">No filters. Records match every filter you add.</p>
      {/each}
      <button type="button" class="add" onclick={addFilter}>＋ Add filter</button>
    </div>
  {:else if open === 'sort'}
    <div class="panel" id={`${uid}-sort`} role="group" aria-label="Sorts">
      {#each view.sorts as s, i (s.field)}
        <div class="line">
          <select class="tint-select" aria-label="Sort field" value={s.field} onchange={(e) => patch({ sorts: view.sorts.map((x, j) => (j === i ? { ...x, field: e.currentTarget.value } : x)) })}>
            {#each fields as o (o.id)}<option value={o.id}>{o.name}</option>{/each}
          </select>
          <select class="tint-select" aria-label="Sort direction" value={s.desc ? 'desc' : 'asc'} onchange={(e) => patch({ sorts: view.sorts.map((x, j) => (j === i ? { ...x, desc: e.currentTarget.value === 'desc' } : x)) })}>
            <option value="asc">Ascending</option><option value="desc">Descending</option>
          </select>
          <button type="button" aria-label="Remove sort" onclick={() => patch({ sorts: view.sorts.filter((_, j) => j !== i) })}>✕</button>
        </div>
      {:else}
        <p class="empty">Records appear in their stored order.</p>
      {/each}
      <button type="button" class="add" disabled={view.sorts.length >= fields.length} onclick={addSort}>＋ Add sort</button>
    </div>
  {:else if open === 'fields'}
    <div class="panel fields" id={`${uid}-fields`} role="group" aria-label="Visible fields">
      {#each fields as f, i (f.id)}
        <label><input type="checkbox" checked={!view.hidden.includes(f.id)} disabled={i === 0} onchange={() => toggleHidden(f.id)} />{f.name}{#if i === 0}<em> · primary</em>{/if}</label>
      {/each}
      <div class="line"><button type="button" onclick={() => patch({ hidden: fields.slice(1).map((f) => f.id) })}>Hide all</button><button type="button" onclick={() => patch({ hidden: [] })}>Show all</button></div>
    </div>
  {/if}
</div>

<style>
  .bar { display: grid; gap: .5rem; min-width: 0; font-size: var(--tint-font-size-sm); }
  .tabs { display: flex; gap: .125rem; border-bottom: 1px solid var(--tint-border); overflow-x: auto; overflow-y: hidden; }
  .tabs button {
    font: inherit; padding: .5rem .875rem; color: var(--tint-muted); background: none; border: 0; border-bottom: 2px solid transparent;
    margin-bottom: -1px; cursor: pointer; white-space: nowrap; outline-offset: -2px;
  }
  .tabs button[aria-selected='true'] { color: var(--tint-ink); border-bottom-color: var(--tint-accent); font-weight: 600; }
  .tabs button:hover { color: var(--tint-ink); }
  .tabs button:focus-visible { outline: 2px solid var(--tint-focus); }
  .tools { display: flex; flex-wrap: wrap; align-items: center; gap: .375rem; }
  .tools button, .panel button {
    font: inherit; font-size: var(--tint-font-size-sm); color: var(--tint-ink); background: var(--tint-panel); border: 1px solid var(--tint-border);
    border-radius: var(--tint-radius-sm); padding: .25rem .625rem; cursor: pointer;
  }
  .tools button:hover:not(:disabled), .panel button:hover:not(:disabled) { background: var(--tint-accent-soft); }
  .tools button[data-active='true'], .tools button[aria-expanded='true'] { background: var(--tint-accent-soft); border-color: var(--tint-accent); }
  button:disabled { opacity: .5; cursor: default; }
  button:focus-visible, select:focus-visible, input:focus-visible { outline: 2px solid var(--tint-focus); outline-offset: 1px; }
  .group { display: inline-flex; align-items: center; gap: .375rem; color: var(--tint-muted); font-size: var(--tint-font-size-xs); }
  select, input:not([type]) { font: inherit; color: var(--tint-ink); background: var(--tint-field); border: 0; border-bottom: 1px solid var(--tint-border-strong); padding: .25rem .5rem; }
  .spacer { flex: 1; }
  .panel { display: grid; gap: .5rem; padding: .75rem; background: var(--tint-surface); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); }
  .line { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; }
  .fields { grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr)); }
  .fields label { display: flex; align-items: center; gap: .5rem; }
  .fields .line { grid-column: 1 / -1; }
  .empty { margin: 0; color: var(--tint-muted); }
  .add { justify-self: start; }
  em { color: var(--tint-muted); font-style: normal; }
</style>
