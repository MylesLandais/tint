import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/icon'

/*
 * Infinite scroll is pagination with a different presentation. It is also not
 * infinite — the active filters bound it — which is why "end of results" is a
 * first-class state here rather than an afterthought.
 *
 * This reports intent and does not fetch. Pair it with whatever owns paging:
 * `table.nextPage()`, a `useInfiniteQuery`, a cursor in the URL.
 */

export type InfiniteRowsProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  /** Whether another page exists. `false` renders the end state. */
  hasMore: boolean
  /** A fetch is in flight. Suppresses further requests. */
  loading?: boolean
  /** Fired once when the sentinel comes into view. */
  onLoadMore: () => void
  /** How far ahead of the viewport to fire. The booru's tuned value. */
  rootMargin?: string
  /** Nothing matched at all — distinct from having reached the end. */
  empty?: boolean
  loadingLabel?: ReactNode
  endLabel?: ReactNode
  emptyLabel?: ReactNode
}

export function InfiniteRows({
  hasMore,
  loading = false,
  onLoadMore,
  rootMargin = '600px',
  empty = false,
  loadingLabel = 'Loading more…',
  endLabel = 'End of results',
  emptyLabel = null,
  className,
  ...props
}: InfiniteRowsProps) {
  const sentinel = useRef<HTMLDivElement>(null)
  // The handler can change every render; reading it through a ref keeps that
  // from tearing down the observer.
  const handler = useRef(onLoadMore)
  handler.current = onLoadMore

  useEffect(() => {
    const node = sentinel.current
    if (!node || typeof IntersectionObserver === 'undefined') return
    if (!hasMore || loading) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        // Fire at most once per arming. The effect below re-arms on the next
        // commit, so a page that lands without pushing the sentinel out of view
        // still asks for the one after it.
        observer.disconnect()
        handler.current()
      },
      { rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()

    // Deliberately no dependency array.
    //
    // An IntersectionObserver reports a *crossing*, not a state: an element that
    // is already in view and stays there produces no further callbacks. Keying
    // this on `loading` is not enough either, because a caller that pages
    // synchronously never flips it. Re-arming every commit is the only version
    // that works whether the caller loads synchronously or asynchronously, and
    // `disconnect()` above is what stops it firing twice for one arming.
  })

  return (
    <div
      ref={sentinel}
      data-infinite-rows=""
      data-state={empty ? 'empty' : loading ? 'loading' : hasMore ? 'ready' : 'end'}
      className={cn(
        'flex min-h-11 items-center justify-center gap-2 py-4 text-xs text-tint-muted',
        className,
      )}
      {...props}
    >
      {/* Polite, so a reader hears that more arrived without losing their place. */}
      <span aria-live="polite" className="flex items-center gap-2">
        {empty ? (
          emptyLabel
        ) : loading ? (
          <>
            <Spinner size="sm" />
            {loadingLabel}
          </>
        ) : hasMore ? null : (
          endLabel
        )}
      </span>
    </div>
  )
}
