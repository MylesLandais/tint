import {
  applyDatasetOps, canRedoEdit, canUndoEdit, createView, emptyEditHistory, recordEdit, redoEdit, undoEdit,
  type DatasetOp, type EditHistory, type FieldDef, type TableView,
} from '../../../core/table'

export type DatasetRow = Record<string, unknown>

export type DatasetStoreOptions<TRow extends DatasetRow> = {
  fields: readonly FieldDef[]
  rows: readonly TRow[]
  views?: readonly TableView[]
  /** Property that uniquely identifies a row. Defaults to `id`. */
  idKey?: string
}

/**
 * Rune-backed state for a dataset editor: rows, schema, saved views and
 * undo/redo. Hosts that persist elsewhere can ignore it and drive
 * `DatasetGrid` through its callbacks instead.
 */
export function createDatasetStore<TRow extends DatasetRow>(options: DatasetStoreOptions<TRow>) {
  const idKey = options.idKey ?? 'id'
  let rows = $state.raw<TRow[]>([...options.rows])
  let fields = $state.raw<FieldDef[]>([...options.fields])
  const initialViews = [...(options.views ?? [createView('all', 'All records')])]
  let views = $state.raw<TableView[]>(initialViews)
  let activeViewId = $state(initialViews[0].id)
  let history = $state.raw<EditHistory<TRow>>(emptyEditHistory<TRow>())
  let lastAction = $state('')

  const activeView = $derived(views.find((v) => v.id === activeViewId) ?? views[0])

  function apply(ops: readonly DatasetOp<TRow>[]) {
    const next = applyDatasetOps({ rows, fields }, ops, idKey)
    rows = next.rows
    fields = next.fields
  }

  return {
    idKey,
    get rows() { return rows },
    get fields() { return fields },
    get views() { return views },
    get activeView() { return activeView },
    get activeViewId() { return activeViewId },
    get canUndo() { return canUndoEdit(history) },
    get canRedo() { return canRedoEdit(history) },
    /** Human-readable description of the last edit, undo or redo, for live regions. */
    get lastAction() { return lastAction },
    edit(ops: readonly DatasetOp<TRow>[], label: string) {
      apply(ops)
      history = recordEdit(history, { label, ops })
      lastAction = label
    },
    undo() {
      const result = undoEdit(history)
      if (!result) return
      apply(result.ops)
      history = result.history
      lastAction = `Undid ${result.label}`
    },
    redo() {
      const result = redoEdit(history)
      if (!result) return
      apply(result.ops)
      history = result.history
      lastAction = `Redid ${result.label}`
    },
    setActiveView(id: string) { if (views.some((v) => v.id === id)) activeViewId = id },
    updateView(next: TableView) { views = views.map((v) => (v.id === next.id ? next : v)) },
    addView(name: string) {
      const id = `view-${views.length + 1}-${Date.now().toString(36)}`
      views = [...views, createView(id, name, { hidden: activeView.hidden, order: activeView.order })]
      activeViewId = id
    },
    removeView(id: string) {
      if (views.length <= 1) return
      views = views.filter((v) => v.id !== id)
      if (activeViewId === id) activeViewId = views[0].id
    },
  }
}

export type DatasetStore<TRow extends DatasetRow = DatasetRow> = ReturnType<typeof createDatasetStore<TRow>>
