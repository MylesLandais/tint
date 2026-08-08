import { ChevronLeft, ChevronRight, Columns3, Eye, EyeOff } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/icon'
import type {
  TableColumnsMenuProps,
  TablePagerProps,
  TableToolbarProps,
} from './types'

/** A slot above the grid for search, filters, and actions. Layout only. */
export function TableToolbar({ className, children, ...props }: TableToolbarProps) {
  return (
    <div
      data-table-toolbar=""
      className={cn(
        'flex flex-wrap items-center gap-2 border-b border-tint-border bg-tint-surface/60 px-3 py-2.5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function columnName<TRow>(column: TableColumnsMenuProps<TRow>['columns'][number]) {
  if (column.label) return column.label
  if (typeof column.header === 'string') return column.header
  return column.id
}

/**
 * Show/hide columns.
 *
 * Controlled, like everything else — pair it with `useTableView` when the choice
 * should survive a reload.
 */
export function TableColumnsMenu<TRow>({
  columns,
  hiddenColumns: hidden,
  onChange,
  label = 'Columns',
  className,
  ...props
}: TableColumnsMenuProps<TRow>) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const hideable = columns.filter((column) => column.hideable !== false)
  const hiddenSet = new Set(hidden)
  const visibleCount = columns.length - hiddenSet.size

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = (id: string) => {
    const next = hiddenSet.has(id)
      ? hidden.filter((candidate) => candidate !== id)
      : [...hidden, id]
    // Never hide the last one — an empty grid looks broken rather than filtered.
    if (next.length >= columns.length) return
    onChange(next)
  }

  return (
    <div
      ref={containerRef}
      data-table-columns-menu=""
      className={cn('relative', className)}
      {...props}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-tint-border bg-tint-panel px-2.5 text-xs font-medium text-tint-ink transition hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
      >
        <Icon icon={Columns3} size="sm" />
        {label}
        {hiddenSet.size ? (
          <span className="rounded-full bg-tint-accent-soft px-1.5 text-[0.6875rem] text-tint-accent">
            {hiddenSet.size} hidden
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute right-0 z-30 mt-1 min-w-52 rounded-xl border border-tint-border bg-tint-panel p-1 shadow-[0_16px_48px_var(--tint-shadow-color)]"
        >
          {hideable.map((column) => {
            const isHidden = hiddenSet.has(column.id)
            const isLast = !isHidden && visibleCount <= 1
            return (
              <button
                key={column.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={!isHidden}
                disabled={isLast}
                onClick={() => toggle(column.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-tint-ink transition hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isHidden ? (
                  <Icon icon={EyeOff} size="sm" className="text-tint-muted" />
                ) : (
                  <Icon icon={Eye} size="sm" className="text-tint-accent" />
                )}
                {columnName(column)}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Page control. `total` is the count *after* filtering and *before* paging —
 * `deriveFilteredSortedRows` produces exactly that.
 */
export function TablePager({
  page,
  pageSize,
  total,
  onChange,
  label = 'Pagination',
  className,
  ...props
}: TablePagerProps) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
  const clamped = Math.min(Math.max(0, page), pageCount - 1)
  const first = total === 0 ? 0 : clamped * pageSize + 1
  const last = Math.min(total, (clamped + 1) * pageSize)

  return (
    <nav
      aria-label={label}
      data-table-pager=""
      className={cn(
        'flex items-center justify-between gap-3 border-t border-tint-border px-3 py-2 text-xs text-tint-muted',
        className,
      )}
      {...props}
    >
      {/* Announced politely so a screen reader hears the new range after paging. */}
      <span aria-live="polite">
        {total === 0 ? 'No rows' : `${first}–${last} of ${total}`}
      </span>
      <span className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onChange(clamped - 1)}
          disabled={clamped === 0}
          aria-label="Previous page"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-tint-border bg-tint-panel transition hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon icon={ChevronLeft} />
        </button>
        <span className="px-1 tabular-nums">
          {clamped + 1} / {pageCount}
        </span>
        <button
          type="button"
          onClick={() => onChange(clamped + 1)}
          disabled={clamped >= pageCount - 1}
          aria-label="Next page"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-tint-border bg-tint-panel transition hover:bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon icon={ChevronRight} />
        </button>
      </span>
    </nav>
  )
}
