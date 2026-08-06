import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'
import type { TableInstance, TableRowId } from './types'

/*
 * A masonry is a table whose cells have inconsistent dimensions.
 *
 * This renders the same row model `DataTable` does — pass either a table
 * instance or a plain array — so sorting, filtering, and paging behave
 * identically and only the placement differs. Ported from the booru's
 * `Masonry.tsx`, with two defects fixed on the way across (see below).
 */

export type DataMasonryProps<TRow> = Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> & {
  rows?: readonly TRow[]
  /** A `useDataTable` instance. Supplies rows in place of the `rows` prop. */
  table?: TableInstance<TRow>
  rowId: (keyof TRow & string) | ((row: TRow) => TableRowId)
  /** Renders one cell. Height is measured, not declared. */
  renderItem: (row: TRow) => ReactNode
  /** `auto` derives a count from the width; a number pins it. */
  density?: MasonryDensity
  /** Gap between cells, in pixels. */
  gap?: number
  /** Ideal column width when `density` is `auto`. */
  targetWidth?: number
  emptyState?: ReactNode
  /** Rendered below the grid — the natural home for an `InfiniteRows` sentinel. */
  footer?: ReactNode
  label?: string
}

export type MasonryDensity = 'auto' | 2 | 3 | 4 | 5 | 6

/**
 * How many columns fit. Pure and exported so it can be tested and reused
 * without mounting anything.
 */
export function columnsFor(
  width: number,
  density: MasonryDensity = 'auto',
  target = 320,
): number {
  if (width < 640) return 1
  if (width < 900) return 2
  if (density !== 'auto') return Math.max(2, Math.min(6, density))
  return Math.max(2, Math.min(6, Math.round(width / target)))
}

export function DataMasonry<TRow>({
  rows: rowsProp,
  table,
  rowId,
  renderItem,
  density = 'auto',
  gap = 12,
  targetWidth = 320,
  emptyState,
  footer,
  label,
  className,
  ...props
}: DataMasonryProps<TRow>) {
  const root = useRef<HTMLDivElement>(null)
  const [, bumpLayout] = useState(0)
  const relayout = useCallback(() => bumpLayout((value) => value + 1), [])

  const rows = table
    ? table.getRowModel().rows.map((row) => row.original)
    : (rowsProp ?? [])

  const getRowId = (row: TRow): TableRowId =>
    typeof rowId === 'function' ? rowId(row) : String(row[rowId])

  useEffect(() => {
    const node = root.current
    if (!node) return

    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(relayout)
    observer?.observe(node)

    // Images arrive without declared dimensions, so the pack is wrong until they
    // load. Capture phase, because `load` does not bubble.
    node.addEventListener('load', relayout, true)

    return () => {
      observer?.disconnect()
      // The original never removed this one — only the observer was cleaned up.
      node.removeEventListener('load', relayout, true)
    }
  }, [relayout])

  useLayoutEffect(() => {
    const node = root.current
    if (!node || !node.clientWidth) return

    const count = columnsFor(node.clientWidth, density, targetWidth)
    const width = (node.clientWidth - gap * (count - 1)) / count
    const items = Array.from(
      node.querySelectorAll<HTMLElement>('[data-masonry-item]'),
    )

    // Three passes, deliberately. The original interleaved writing a transform
    // with reading the next item's height, which forces a synchronous layout per
    // item — O(n) layouts instead of one. Widths are written, heights are read
    // in a single batch, then positions are written in a second batch.
    for (const item of items) {
      item.style.position = 'absolute'
      item.style.width = `${width}px`
    }

    const heights = items.map((item) => item.offsetHeight)

    const columnHeights = Array<number>(count).fill(0)
    items.forEach((item, index) => {
      let column = 0
      for (let candidate = 1; candidate < columnHeights.length; candidate += 1) {
        if (columnHeights[candidate]! < columnHeights[column]!) column = candidate
      }
      item.style.transform = `translate(${column * (width + gap)}px, ${columnHeights[column]}px)`
      columnHeights[column] += heights[index]! + gap
    })

    node.style.height = `${Math.max(0, Math.max(...columnHeights) - (items.length ? gap : 0))}px`
  })

  return (
    <>
      {/*
        A list, because that is what it is. Items stay in source order in the DOM
        and are only positioned visually, so tab order and screen-reader order
        still follow the sort — which is the thing absolute positioning usually
        breaks.
      */}
      <div
        ref={root}
        role="list"
        aria-label={label}
        data-masonry=""
        data-density={density}
        className={cn('relative w-full', className)}
        {...props}
      >
        {rows.map((row) => (
          <div key={getRowId(row)} role="listitem" data-masonry-item="" data-row-id={getRowId(row)}>
            {renderItem(row)}
          </div>
        ))}
      </div>

      {rows.length === 0
        ? (emptyState ?? (
            <p className="m-0 px-6 py-12 text-center text-sm text-tint-muted">
              Nothing to show.
            </p>
          ))
        : null}

      {footer}
    </>
  )
}
