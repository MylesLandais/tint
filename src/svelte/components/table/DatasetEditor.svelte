<script lang="ts" generics="TRow extends Record<string, unknown>">
  import type { DatasetStore } from './datasetStore.svelte'
  import DatasetGrid from './DatasetGrid.svelte'
  import RecordPanel from './RecordPanel.svelte'
  import ViewBar from './ViewBar.svelte'

  type Props = {
    store: DatasetStore<TRow>
    label: string
    height?: number
    readOnly?: boolean
  }
  let { store, label, height = 520, readOnly = false }: Props = $props()

  let openId = $state<string | null>(null)
  const openRow = $derived(openId == null ? undefined : store.rows.find((r) => String(r[store.idKey]) === openId))

  function step(direction: -1 | 1) {
    const i = store.rows.findIndex((r) => String(r[store.idKey]) === openId)
    const next = store.rows[i + direction]
    if (next) openId = String(next[store.idKey])
  }
  function remove(id: string) {
    const index = store.rows.findIndex((r) => String(r[store.idKey]) === id)
    const row = store.rows[index]
    if (!row) return
    store.edit([{ kind: 'remove-row', row, index }], 'Delete record')
    openId = null
  }
</script>

<div class="editor" data-open={openRow ? '' : undefined}>
  <ViewBar
    fields={store.fields} views={store.views} view={store.activeView}
    canUndo={store.canUndo} canRedo={store.canRedo}
    onSelectView={(id) => store.setActiveView(id)} onUpdateView={(v) => store.updateView(v)}
    onAddView={(name) => store.addView(name)} onRemoveView={(id) => store.removeView(id)}
    onUndo={() => store.undo()} onRedo={() => store.redo()}
  />
  <div class="work">
    <div class="grid-slot">
      <DatasetGrid
        fields={store.fields} rows={store.rows} view={store.activeView} {label} {height} {readOnly} idKey={store.idKey}
        onEdit={(ops, text) => store.edit(ops, text)} onViewChange={(v) => store.updateView(v)}
        onFieldWidth={(id, width) => store.edit([{ kind: 'schema', before: store.fields, after: store.fields.map((f) => (f.id === id ? { ...f, width } : f)) }], 'Resize field')}
        onOpenRecord={(id) => (openId = id)} onUndo={() => store.undo()} onRedo={() => store.redo()}
      />
    </div>
    {#if openRow}
      <div class="record" style:max-height="{height + 90}px">
        <RecordPanel
          fields={store.fields} row={openRow} idKey={store.idKey} hidden={store.activeView.hidden} {readOnly}
          onEdit={(ops, text) => store.edit(ops, text)} onDelete={remove} onClose={() => (openId = null)} onStep={step}
        />
      </div>
    {/if}
  </div>
  <p class="sr" role="status" aria-live="polite">{store.lastAction}</p>
</div>

<style>
  .editor { display: grid; gap: .75rem; min-width: 0; container-type: inline-size; }
  .work { display: grid; gap: .75rem; grid-template-columns: minmax(0, 1fr); align-items: start; }
  .grid-slot { min-width: 0; }
  .record { min-width: 0; overflow: auto; }
  @container (min-width: 60rem) { .work:has(.record) { grid-template-columns: minmax(0, 1fr) 22rem; } }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); margin: 0; }
</style>
