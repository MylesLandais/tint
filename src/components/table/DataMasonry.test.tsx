import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataMasonry, columnsFor } from './DataMasonry'
import { InfiniteRows } from './InfiniteRows'

type Item = { id: string; title: string }

const items: Item[] = Array.from({ length: 6 }, (_, i) => ({
  id: `i${i}`,
  title: `Item ${i}`,
}))

describe('columnsFor', () => {
  it('collapses to one column on narrow viewports', () => {
    expect(columnsFor(320)).toBe(1)
    expect(columnsFor(639)).toBe(1)
  })

  it('uses two columns in the tablet band regardless of density', () => {
    expect(columnsFor(700)).toBe(2)
    expect(columnsFor(700, 6)).toBe(2)
  })

  it('derives a count from the width when density is auto', () => {
    expect(columnsFor(1280, 'auto', 320)).toBe(4)
    expect(columnsFor(960, 'auto', 320)).toBe(3)
  })

  it('honours a pinned density above the breakpoints', () => {
    expect(columnsFor(1280, 3)).toBe(3)
    expect(columnsFor(1280, 5)).toBe(5)
  })

  it('clamps a pinned density into the supported range', () => {
    expect(columnsFor(4000, 'auto', 320)).toBe(6)
    expect(columnsFor(1280, 1 as never)).toBe(2)
  })
})

describe('DataMasonry', () => {
  it('renders every row as a list item in source order', () => {
    render(
      <DataMasonry
        rows={items}
        rowId="id"
        label="Items"
        renderItem={(item) => <span>{item.title}</span>}
      />,
    )

    const list = screen.getByRole('list', { name: 'Items' })
    const rendered = screen.getAllByRole('listitem')
    expect(list).toBeInTheDocument()
    expect(rendered).toHaveLength(6)
    // DOM order follows the row order, which is what keeps tab order and
    // screen-reader order matching the sort despite absolute positioning.
    expect(rendered.map((el) => el.textContent)).toEqual([
      'Item 0', 'Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5',
    ])
  })

  it('tags each item with its row id', () => {
    const { container } = render(
      <DataMasonry rows={items} rowId="id" renderItem={(i) => <span>{i.title}</span>} />,
    )
    expect(
      Array.from(container.querySelectorAll('[data-masonry-item]')).map((el) =>
        el.getAttribute('data-row-id'),
      ),
    ).toEqual(['i0', 'i1', 'i2', 'i3', 'i4', 'i5'])
  })

  it('shows the empty state and still renders the footer', () => {
    render(
      <DataMasonry
        rows={[]}
        rowId="id"
        renderItem={() => null}
        emptyState={<p>No items match.</p>}
        footer={<p>footer</p>}
      />,
    )
    expect(screen.getByText('No items match.')).toBeInTheDocument()
    expect(screen.getByText('footer')).toBeInTheDocument()
  })

  it('removes both listeners on unmount', () => {
    // The original registered a capture-phase `load` listener and only ever
    // disconnected the observer, leaking one listener per mount.
    const disconnect = vi.fn()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn()
        disconnect = disconnect
      },
    )
    const remove = vi.spyOn(HTMLElement.prototype, 'removeEventListener')

    const { unmount } = render(
      <DataMasonry rows={items} rowId="id" renderItem={(i) => <span>{i.title}</span>} />,
    )
    unmount()

    expect(disconnect).toHaveBeenCalled()
    expect(remove).toHaveBeenCalledWith('load', expect.any(Function), true)

    remove.mockRestore()
    vi.unstubAllGlobals()
  })
})

describe('InfiniteRows', () => {
  function observeOnce() {
    const callbacks: Array<(entries: unknown[]) => void> = []
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (entries: unknown[]) => void) {
          callbacks.push(cb)
        }
        observe = vi.fn()
        disconnect = vi.fn()
      },
    )
    return {
      intersect: () => callbacks.forEach((cb) => cb([{ isIntersecting: true }])),
    }
  }

  it('asks for more when the sentinel comes into view', () => {
    const { intersect } = observeOnce()
    const onLoadMore = vi.fn()
    render(<InfiniteRows hasMore onLoadMore={onLoadMore} />)

    intersect()
    expect(onLoadMore).toHaveBeenCalledOnce()
    vi.unstubAllGlobals()
  })

  it('stays quiet while a fetch is already in flight', () => {
    const { intersect } = observeOnce()
    const onLoadMore = vi.fn()
    render(<InfiniteRows hasMore loading onLoadMore={onLoadMore} />)

    intersect()
    expect(onLoadMore).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('stays quiet once the results are exhausted', () => {
    const { intersect } = observeOnce()
    const onLoadMore = vi.fn()
    render(<InfiniteRows hasMore={false} onLoadMore={onLoadMore} />)

    intersect()
    expect(onLoadMore).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('distinguishes end-of-results from nothing-matched', () => {
    const { rerender, container } = render(
      <InfiniteRows hasMore={false} onLoadMore={vi.fn()} />,
    )
    expect(screen.getByText('End of results')).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('data-state', 'end')

    rerender(
      <InfiniteRows
        hasMore={false}
        empty
        onLoadMore={vi.fn()}
        emptyLabel="Nothing matched."
      />,
    )
    expect(screen.getByText('Nothing matched.')).toBeInTheDocument()
    expect(container.firstChild).toHaveAttribute('data-state', 'empty')
  })

  it('announces loading politely rather than assertively', () => {
    const { container } = render(<InfiniteRows hasMore loading onLoadMore={vi.fn()} />)
    expect(container.querySelector('[aria-live="polite"]')).toHaveTextContent(
      'Loading more…',
    )
  })

  it('does not throw where IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    expect(() =>
      render(<InfiniteRows hasMore onLoadMore={vi.fn()} />),
    ).not.toThrow()
    vi.unstubAllGlobals()
  })
})

describe('InfiniteRows re-arming', () => {
  it('fires again once a load settles while still in view', () => {
    // An IntersectionObserver reports a crossing, not a state. If a page arrives
    // without pushing the sentinel out of view, a long-lived observer never
    // reports again and the scroll stalls after one page.
    const observed: Array<(entries: unknown[]) => void> = []
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: (entries: unknown[]) => void) {
          observed.push(cb)
        }
        observe = vi.fn()
        disconnect = vi.fn()
      },
    )

    const onLoadMore = vi.fn()
    const { rerender } = render(
      <InfiniteRows hasMore loading={false} onLoadMore={onLoadMore} />,
    )
    observed.at(-1)!([{ isIntersecting: true }])
    expect(onLoadMore).toHaveBeenCalledTimes(1)

    // A fetch starts, then settles with the sentinel still on screen.
    rerender(<InfiniteRows hasMore loading onLoadMore={onLoadMore} />)
    rerender(<InfiniteRows hasMore loading={false} onLoadMore={onLoadMore} />)

    observed.at(-1)!([{ isIntersecting: true }])
    expect(onLoadMore).toHaveBeenCalledTimes(2)

    vi.unstubAllGlobals()
  })
})
