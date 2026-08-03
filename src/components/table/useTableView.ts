import { useCallback, useEffect, useRef, useState } from 'react'
import type { TableViewState } from './types'

/**
 * A reader's personal view of a table — which columns they hid, which they
 * pinned — persisted under a caller-chosen key.
 *
 * The same split the theme hooks use: the hook owns persistence so `DataTable`
 * can stay strictly controlled. Pass `viewKey: undefined` and it degrades to
 * ordinary component state, which is what you want in tests and previews.
 */
export function useTableView(
  viewKey: string | undefined,
  initial: Partial<TableViewState> = {},
) {
  // Captured once. `initial` is typically an object literal, so reading it on
  // every render would give `reset` a new identity each time.
  const defaults = useRef<TableViewState>({
    hiddenColumns: initial.hiddenColumns ?? [],
    pinnedColumns: initial.pinnedColumns ?? [],
  })
  const { hiddenColumns: initialHidden, pinnedColumns: initialPinned } = defaults.current

  const [view, setView] = useState<TableViewState>(() => {
    const fallback = { hiddenColumns: initialHidden, pinnedColumns: initialPinned }
    if (!viewKey || typeof window === 'undefined') return fallback

    try {
      const raw = window.localStorage.getItem(viewKey)
      if (!raw) return fallback
      const parsed: unknown = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return fallback
      const stored = parsed as Partial<TableViewState>
      return {
        hiddenColumns: Array.isArray(stored.hiddenColumns)
          ? stored.hiddenColumns
          : initialHidden,
        pinnedColumns: Array.isArray(stored.pinnedColumns)
          ? stored.pinnedColumns
          : initialPinned,
      }
    } catch {
      // Unavailable or corrupt storage should not stop a table rendering.
      return fallback
    }
  })

  useEffect(() => {
    if (!viewKey || typeof window === 'undefined') return
    try {
      window.localStorage.setItem(viewKey, JSON.stringify(view))
    } catch {
      // Applied for this session even if it cannot be persisted.
    }
  }, [viewKey, view])

  const setHiddenColumns = useCallback((hiddenColumns: readonly string[]) => {
    setView((current) => ({ ...current, hiddenColumns }))
  }, [])

  const setPinnedColumns = useCallback((pinnedColumns: readonly string[]) => {
    setView((current) => ({ ...current, pinnedColumns }))
  }, [])

  /** Back to the view the table shipped with. */
  const reset = useCallback(() => {
    setView({ ...defaults.current })
  }, [])

  return {
    hiddenColumns: view.hiddenColumns,
    pinnedColumns: view.pinnedColumns,
    setHiddenColumns,
    setPinnedColumns,
    reset,
  }
}
