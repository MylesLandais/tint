import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type UIEvent,
} from 'react'
import { cn } from '../../lib/utils'
import { Icon } from '../icon'
import { getCellValue, nextSort, visibleColumns } from './derive'
import { formatFieldValue, resolveFieldType } from './fieldTypes'
import type {
  DataTableProps,
  TableAlign,
  TableColumn,
  TableDensity,
  TableRowId,
} from './types'

const DENSITY_ROW_HEIGHT: Record<TableDensity, string> = {
  compact: '1.75rem',
  comfortable: '2.5rem',
  spacious: '3.25rem',
}

/** Width assumed for a pinned column that did not declare one. */
const DEFAULT_PINNED_WIDTH = 96
/** Gutter reserved at the left edge for the selection checkbox. */
const SELECTION_GUTTER = 44

function columnAlign<TRow>(column: TableColumn<TRow>): TableAlign {
  return column.align ?? resolveFieldType(column.type).align
}

function headerLabel<TRow>(column: TableColumn<TRow>): string {
  if (column.label) return column.label
  if (typeof column.header === 'string') return column.header
  return column.id
}

/**
 * Cumulative left offsets for pinned columns, in visible order.
 *
 * Hidden columns contribute nothing — a pinned column that has been hidden must
 * not leave a gap the remaining ones are still offset by.
 */
function pinnedOffsets<TRow>(columns: readonly TableColumn<TRow>[], gutter: number) {
  const offsets = new Map<string, number>()
  let running = gutter
  for (const column of columns) {
    if (!column.pinned) continue
    offsets.set(column.id, running)
    running += column.width ?? DEFAULT_PINNED_WIDTH
  }
  return offsets
}

export function DataTable<TRow>({
  rows: rowsProp,
  table,
  columns,
  rowId,
  label,
  caption,
  density = 'comfortable',
  emptyState,
  rowHeaderColumn,
  sort,
  onSortChange,
  selection,
  onSelectionChange,
  selectionLabel,
  expanded,
  onExpandedChange,
  renderExpanded,
  hiddenColumns,
  className,
  onScroll,
  ref,
  ...props
}: DataTableProps<TRow>) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scrolledRight, setScrolledRight] = useState(false)

  // Either source works. An instance means the engine owns filtering, sorting,
  // and paging — which is what lets this grid and a `DataMasonry` render the
  // same rows without either one holding its own copy of that state.
  //
  // Not memoized on purpose: the row model is already memoized inside the
  // engine, and any dep that tracked its state would change identity every
  // render anyway.
  const rows = table
    ? table.getRowModel().rows.map((row) => row.original)
    : (rowsProp ?? [])

  const getRowId = useCallback(
    (row: TRow): TableRowId =>
      typeof rowId === 'function' ? rowId(row) : String(row[rowId]),
    [rowId],
  )

  const shown = useMemo(
    () => visibleColumns(columns, hiddenColumns ?? []),
    [columns, hiddenColumns],
  )

  const selectable = Boolean(selection && onSelectionChange)
  const expandable = Boolean(expanded && onExpandedChange && renderExpanded)
  const gutter = selectable ? SELECTION_GUTTER : 0
  const offsets = useMemo(() => pinnedOffsets(shown, gutter), [shown, gutter])

  const selectedSet = useMemo(() => new Set(selection ?? []), [selection])
  const expandedSet = useMemo(() => new Set(expanded ?? []), [expanded])

  const headerColumn = rowHeaderColumn ?? shown[0]?.id
  const allSelected =
    rows.length > 0 && rows.every((row) => selectedSet.has(getRowId(row)))

  // The pinned edge only earns a shadow once something is actually hidden
  // behind it — a permanent divider would read as decoration.
  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    setScrolledRight(event.currentTarget.scrollLeft > 0)
    onScroll?.(event)
  }

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    setScrolledRight(viewport.scrollLeft > 0)
  }, [shown.length])

  const toggleRow = (row: TRow) => {
    if (!selection || !onSelectionChange) return
    const id = getRowId(row)
    const isSelected = selectedSet.has(id)
    const next = isSelected
      ? selection.filter((candidate) => candidate !== id)
      : [...selection, id]
    onSelectionChange({ selection: next, rowId: id, selected: !isSelected })
  }

  const toggleVisible = () => {
    if (!selection || !onSelectionChange) return
    const visibleIds = rows.map(getRowId)
    const next = allSelected
      ? selection.filter((id) => !visibleIds.includes(id))
      : [...selection, ...visibleIds.filter((id) => !selectedSet.has(id))]
    onSelectionChange({ selection: next, rowId: null, selected: !allSelected })
  }

  const toggleExpanded = (row: TRow) => {
    if (!expanded || !onExpandedChange) return
    const id = getRowId(row)
    const next = expandedSet.has(id)
      ? expanded.filter((candidate) => candidate !== id)
      : [...expanded, id]
    onExpandedChange(next, id)
  }

  const rowLabel = (row: TRow): string => {
    if (selectionLabel) return selectionLabel(row)
    const column = shown.find((candidate) => candidate.id === headerColumn)
    return column ? String(getCellValue(row, column) ?? getRowId(row)) : getRowId(row)
  }

  const columnSpan = shown.length + (selectable ? 1 : 0) + (expandable ? 1 : 0)

  return (
    <div
      ref={(node) => {
        viewportRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      data-table=""
      data-density={density}
      data-scrolled={scrolledRight || undefined}
      onScroll={handleScroll}
      className={cn('w-full overflow-x-auto', className)}
      style={{ ['--tint-table-row-h' as string]: DENSITY_ROW_HEIGHT[density] }}
      {...props}
    >
      {/*
        A real <table>, and deliberately not role="grid". The grid role promises
        arrow-key cell navigation; announcing it without implementing it leaves a
        screen-reader user pressing keys that do nothing.
      */}
      {/*
        border-separate, so every cell owns its own rule. Under a collapsed
        border model adjacent cells share one, which a pinned column then drags
        over its neighbours as it scrolls. Row rules therefore live on the cells,
        not on the `<tr>`.
      */}
      <table
        aria-label={caption ? undefined : label}
        className="w-full border-separate border-spacing-0 text-sm"
      >
        {caption ? (
          <caption className="px-3 py-2 text-left text-sm text-tint-muted">
            {caption}
          </caption>
        ) : null}

        <thead>
          <tr className="bg-tint-surface text-left [&>th]:border-b [&>th]:border-tint-border">
            {expandable ? <th scope="col" className="w-9 px-1" /> : null}

            {selectable ? (
              <th scope="col" className="sticky left-0 z-20 w-11 bg-tint-surface px-2">
                {/* The label is the target, so the hit area clears the 24x24
                    minimum of WCAG 2.2 SC 2.5.8 while the control stays 16px —
                    a checkbox scaled up to 24 would dominate a dense row. */}
                <label className="flex size-6 cursor-pointer items-center justify-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleVisible}
                    aria-label="Select all visible rows"
                    className="size-4 accent-[var(--tint-accent)]"
                  />
                </label>
              </th>
            ) : null}

            {shown.map((column) => {
              const active = sort?.column === column.id
              const align = columnAlign(column)
              const offset = offsets.get(column.id)

              return (
                <th
                  key={column.id}
                  scope="col"
                  data-column={column.id}
                  data-pinned={column.pinned || undefined}
                  aria-sort={
                    column.sortable
                      ? active
                        ? sort?.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                  style={
                    column.pinned
                      ? { left: offset, width: column.width }
                      : { width: column.width }
                  }
                  className={cn(
                    'px-3 py-2 font-medium text-tint-muted',
                    align === 'end' && 'text-right',
                    column.pinned &&
                      'sticky z-20 bg-tint-surface after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-tint-border',
                  )}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange?.(nextSort(sort, column.id))}
                      aria-label={
                        active
                          ? `${headerLabel(column)}, sorted ${
                              sort?.direction === 'asc' ? 'ascending' : 'descending'
                            }. Activate to change.`
                          : `Sort by ${headerLabel(column)}`
                      }
                      className={cn(
                        'group/sort inline-flex min-h-9 items-center gap-1 rounded-md px-1 font-medium transition hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent',
                        align === 'end' && 'flex-row-reverse',
                        active && 'text-tint-ink',
                      )}
                    >
                      {column.header ?? column.id}
                      {active ? (
                        sort?.direction === 'asc' ? (
                          <Icon icon={ArrowUp} size="sm" />
                        ) : (
                          <Icon icon={ArrowDown} size="sm" />
                        )
                      ) : (
                        // Hinted rather than shouted: it appears on approach.
                        <Icon
                          icon={ChevronsUpDown}
                          size="sm"
                          className="opacity-0 transition-opacity group-hover/sort:opacity-50 group-focus-visible/sort:opacity-50 motion-reduce:transition-none"
                        />
                      )}
                    </button>
                  ) : (
                    (column.header ?? column.id)
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        {/* Rules sit on cells, so the first row skips its top border — the
            header already draws that line. */}
        <tbody className="[&>tr:first-child>*]:border-t-0">
          {rows.map((row) => {
            const id = getRowId(row)
            const isSelected = selectedSet.has(id)
            const isExpanded = expandedSet.has(id)

            return (
              <FragmentRow
                key={id}
                id={id}
                row={row}
                columns={shown}
                offsets={offsets}
                headerColumn={headerColumn}
                selectable={selectable}
                isSelected={isSelected}
                onToggleSelect={() => toggleRow(row)}
                selectLabel={rowLabel(row)}
                expandable={expandable}
                isExpanded={isExpanded}
                onToggleExpanded={() => toggleExpanded(row)}
                renderExpanded={renderExpanded}
                columnSpan={columnSpan}
              />
            )
          })}
        </tbody>
      </table>

      {rows.length === 0
        ? (emptyState ?? (
            <p className="m-0 px-6 py-12 text-center text-sm text-tint-muted">
              Nothing to show.
            </p>
          ))
        : null}
    </div>
  )
}

function FragmentRow<TRow>({
  id,
  row,
  columns,
  offsets,
  headerColumn,
  selectable,
  isSelected,
  onToggleSelect,
  selectLabel,
  expandable,
  isExpanded,
  onToggleExpanded,
  renderExpanded,
  columnSpan,
}: {
  id: TableRowId
  row: TRow
  columns: readonly TableColumn<TRow>[]
  offsets: Map<string, number>
  headerColumn?: string
  selectable: boolean
  isSelected: boolean
  onToggleSelect: () => void
  selectLabel: string
  expandable: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
  renderExpanded?: (row: TRow) => ReactNode
  columnSpan: number
}) {
  const detail = isExpanded && renderExpanded ? renderExpanded(row) : null

  return (
    <>
      {/*
        A pinned cell needs an opaque background to occlude what scrolls under
        it, which would otherwise hide the row's hover and selected states. The
        row is a group so those cells can paint the same states themselves.
      */}
      <tr
        data-row-id={id}
        data-selected={isSelected || undefined}
        data-expanded={isExpanded || undefined}
        className="group/row transition-colors hover:bg-tint-accent-soft/40 data-[selected=true]:bg-tint-accent-soft [&>*]:border-t [&>*]:border-tint-border/70"
      >
        {expandable ? (
          <td className="w-9 px-1 align-middle">
            <button
              type="button"
              onClick={onToggleExpanded}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${selectLabel}`}
              className="inline-flex size-7 items-center justify-center rounded-md text-tint-muted transition hover:bg-tint-surface hover:text-tint-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
            >
              <Icon
                icon={ChevronRight}
                className={cn(
                  'transition-transform motion-reduce:transition-none',
                  isExpanded && 'rotate-90',
                )}
              />
            </button>
          </td>
        ) : null}

        {selectable ? (
          <td className="sticky left-0 z-10 w-11 bg-tint-panel px-2 align-middle transition-colors group-hover/row:bg-tint-accent-soft/40 group-data-[selected=true]/row:bg-tint-accent-soft">
            <label className="flex size-6 cursor-pointer items-center justify-center">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                aria-label={`Select ${selectLabel}`}
                className="size-4 accent-[var(--tint-accent)]"
              />
            </label>
          </td>
        ) : null}

        {columns.map((column) => {
          const value = getCellValue(row, column)
          const align = columnAlign(column)
          const field = resolveFieldType(column.type)
          const content = column.renderCell
            ? column.renderCell(row)
            : formatFieldValue(value, column.type)

          const shared = cn(
            'px-3 align-middle',
            align === 'end' && 'text-right',
            field.mono && 'font-mono tabular-nums',
            column.pinned &&
              'sticky z-10 bg-tint-panel transition-colors group-hover/row:bg-tint-accent-soft/40 group-data-[selected=true]/row:bg-tint-accent-soft after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-tint-border',
          )
          const style = column.pinned
            ? { left: offsets.get(column.id), width: column.width }
            : { width: column.width }

          // The row's identifying column is a header cell, so a screen reader
          // announces "Allen Mock, 30" rather than a bare "30".
          return column.id === headerColumn ? (
            <th
              key={column.id}
              scope="row"
              data-column={column.id}
              style={style}
              className={cn(shared, 'py-2 text-left font-medium text-tint-ink')}
            >
              {content}
            </th>
          ) : (
            <td
              key={column.id}
              data-column={column.id}
              style={style}
              className={cn(shared, 'py-2 text-tint-ink')}
            >
              {content}
            </td>
          )
        })}
      </tr>

      {isExpanded ? (
        <tr data-row-detail={id}>
          <td
            colSpan={columnSpan}
            className="border-t border-tint-border/70 bg-tint-surface/60 px-3 py-3"
          >
            {detail ?? (
              <p className="m-0 text-sm text-tint-muted">Nothing to show here.</p>
            )}
          </td>
        </tr>
      ) : null}
    </>
  )
}
