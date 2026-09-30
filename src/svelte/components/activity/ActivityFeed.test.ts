import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import type { ActivityEvent } from '../../../core/activity'
import ActivityFeed from './ActivityFeed.svelte'
import ActivityFeedFixture from './ActivityFeedFixture.svelte'
import ActivityFeedRow from './ActivityFeedRow.svelte'

const events: ActivityEvent[] = [
  { id: 'older', title: 'Older', href: '#older', publishedAt: '2026-08-01T09:00:00Z', signals: ['top'], score: 40, commentCount: 4, shareCount: 1, attribution: 'Desk' },
  { id: 'recent', title: 'Recent', href: '#recent', publishedAt: '2026-08-20T09:00:00Z', signals: ['new'], score: 2, commentCount: 1, shareCount: 0, attribution: 'Studio' },
]

describe('Svelte activity feed', () => {
  it('ranks by the host sort and reports sort intent without changing the supplied sort', async () => {
    const onSortChange = vi.fn()
    const view = render(ActivityFeed, { props: { events, sort: 'top', onSortChange, now: Date.parse('2026-08-20T10:00:00Z') } })
    expect([...view.container.querySelectorAll('[data-tint-activity-row] h3')].map((node) => node.textContent)).toEqual(['Older', 'Recent'])
    expect([...view.container.querySelectorAll('[data-tint-activity-row] .rank')].map((node) => node.textContent)).toEqual(['1', '2'])
    await fireEvent.click(screen.getByRole('button', { name: 'new' }))
    expect(onSortChange).toHaveBeenCalledWith('new')
    expect(screen.getByRole('button', { name: 'top' })).toHaveAttribute('aria-pressed', 'true')
    await view.rerender({ events, sort: 'new', onSortChange, now: Date.parse('2026-08-20T10:00:00Z') })
    expect([...view.container.querySelectorAll('[data-tint-activity-row] h3')].map((node) => node.textContent)).toEqual(['Recent', 'Older'])
  })

  it('reports pointer selection and exposes a separate native selection button beside the title link', async () => {
    const onSelect = vi.fn()
    const view = render(ActivityFeedRow, { event: events[0], selected: true, onSelect })
    const row = screen.getByRole('article')
    const select = screen.getByRole('button', { name: 'Select Older' })
    expect(select).toHaveAttribute('aria-pressed', 'true')
    expect(row).toHaveAttribute('data-selected')
    await fireEvent.click(row)
    await fireEvent.click(select)
    expect(onSelect.mock.calls).toEqual([['older'], ['older']])
    await fireEvent.click(screen.getByRole('link', { name: 'Older' }))
    expect(onSelect).toHaveBeenCalledTimes(2)
    view.unmount()
    render(ActivityFeedRow, { event: events[0] })
    expect(screen.getByRole('article')).toBeInTheDocument()
  })

  it('renders host actions for each event without selecting their row', async () => {
    const onSelect = vi.fn()
    const onAction = vi.fn()
    render(ActivityFeedFixture, { props: { events, onSelect, onAction } })
    await fireEvent.click(screen.getByRole('button', { name: 'Action Older' }))
    expect(onAction).toHaveBeenCalledWith('older')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('renders a host supplied empty state', () => {
    render(ActivityFeed, { props: { events: [], empty: 'Nothing ranked yet.' } })
    expect(screen.getByText('Nothing ranked yet.')).toBeInTheDocument()
  })
})
