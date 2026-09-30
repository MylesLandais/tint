import { fireEvent, render, screen, within } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import type { CalendarEvent } from '../../../core/calendar'
import CalendarFixture from './CalendarFixture.svelte'
import CalendarMonthView from './CalendarMonthView.svelte'
import CalendarToolbar from './CalendarToolbar.svelte'

const TODAY = new Date(2026, 2, 15)
const events: CalendarEvent[] = [
  { id: 'standup', title: 'Standup', start: '2026-03-10T09:00:00', end: '2026-03-10T09:15:00', source: 'work', status: 'confirmed' },
  { id: 'offsite', title: 'Offsite', allDay: true, start: '2026-03-03', end: '2026-03-06' },
]

function cell(date: string): HTMLElement {
  return screen.getByRole('gridcell', { name: date })
}

describe('Svelte calendar', () => {
  it('renders a labelled, Monday-first month grid with one bar per multi-day event', () => {
    const { container } = render(CalendarMonthView, { props: {
      year: 2026, month: 3, events, weekStart: 1, today: TODAY, selectedDate: '2026-03-10', label: 'March schedule',
    } })
    expect(screen.getByRole('grid', { name: 'March schedule' })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(cell('2026-02-23')).toHaveClass('outside')
    expect(cell('2026-03-10')).toHaveAttribute('aria-selected', 'true')
    expect(within(cell('2026-03-10')).getByText('Standup')).toBeInTheDocument()
    expect(cell('2026-03-15').querySelector('.today')).toHaveTextContent('15')
    expect(screen.getAllByText('Offsite')).toHaveLength(1)
    expect(container.querySelectorAll('[data-tint-calendar-span]')).toHaveLength(1)
    expect(container.querySelector('[data-tint-calendar-event]')).toHaveAttribute('data-source', 'work')
  })

  it('reports date and event intent separately for pointer and keyboard activation', async () => {
    const onSelectDate = vi.fn()
    const onSelectEvent = vi.fn()
    render(CalendarMonthView, { props: { year: 2026, month: 3, events, today: TODAY, onSelectDate, onSelectEvent } })
    await fireEvent.click(cell('2026-03-12'))
    await fireEvent.keyDown(cell('2026-03-12'), { key: 'Enter' })
    await fireEvent.keyDown(cell('2026-03-12'), { key: ' ' })
    expect(onSelectDate).toHaveBeenCalledTimes(3)
    expect(onSelectDate).toHaveBeenLastCalledWith('2026-03-12')
    await fireEvent.click(screen.getByRole('button', { name: 'Standup' }))
    expect(onSelectEvent).toHaveBeenCalledWith(expect.objectContaining({ id: 'standup' }))
    expect(onSelectDate).toHaveBeenCalledTimes(3)
    await fireEvent.keyDown(screen.getByRole('button', { name: 'Standup' }), { key: 'Enter' })
    expect(onSelectDate).toHaveBeenCalledTimes(3)
  })

  it('keeps one day in the Tab order and moves focus with grid keys without selecting', async () => {
    const onSelectDate = vi.fn()
    render(CalendarMonthView, { props: {
      year: 2026, month: 3, events, today: TODAY, selectedDate: '2026-03-10', onSelectDate,
    } })
    expect(cell('2026-03-10')).toHaveAttribute('tabindex', '0')
    expect(cell('2026-03-11')).toHaveAttribute('tabindex', '-1')
    expect(cell('2026-03-15')).toHaveAttribute('aria-current', 'date')
    cell('2026-03-10').focus()
    await fireEvent.keyDown(cell('2026-03-10'), { key: 'ArrowRight' })
    expect(cell('2026-03-11')).toHaveFocus()
    expect(cell('2026-03-11')).toHaveAttribute('tabindex', '0')
    await fireEvent.keyDown(cell('2026-03-11'), { key: 'ArrowDown' })
    expect(cell('2026-03-18')).toHaveFocus()
    await fireEvent.keyDown(cell('2026-03-18'), { key: 'Home' })
    expect(cell('2026-03-15')).toHaveFocus()
    expect(onSelectDate).not.toHaveBeenCalled()
    await fireEvent.keyDown(cell('2026-03-15'), { key: 'Enter' })
    expect(onSelectDate).toHaveBeenCalledWith('2026-03-15')
  })

  it('keeps date cells passive without a selection callback and shows event overflow', () => {
    const many: CalendarEvent[] = Array.from({ length: 4 }, (_, index) => ({
      id: `e${index}`, title: `Event ${index}`, start: '2026-03-10T09:00:00', end: '2026-03-10T10:00:00',
    }))
    render(CalendarMonthView, { props: { year: 2026, month: 3, events: many, today: TODAY, maxEventsPerDay: 2 } })
    expect(cell('2026-03-10')).not.toHaveAttribute('tabindex')
    expect(within(cell('2026-03-10')).getByText('+2 more')).toBeInTheDocument()
    expect(within(cell('2026-03-10')).queryByText('Event 2')).toBeNull()
  })

  it('accepts custom snippets for single and multi-day events', () => {
    render(CalendarFixture)
    expect(screen.getByText('custom Standup')).toBeInTheDocument()
    expect(screen.getByText('bar Offsite')).toBeInTheDocument()
    expect(screen.queryByText('Standup')).toBeNull()
  })

  it('reports previous, next, and injected today months without changing controlled props', async () => {
    const onNavigate = vi.fn()
    const view = render(CalendarToolbar, { year: 2026, month: 1, today: new Date(2025, 11, 9), locale: 'en-US', onNavigate })
    expect(screen.getByRole('heading', { name: 'January 2026' })).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    expect(onNavigate.mock.calls.map(([next]) => next)).toEqual([
      { year: 2025, month: 12 }, { year: 2026, month: 2 }, { year: 2025, month: 12 },
    ])
    expect(screen.getByRole('heading', { name: 'January 2026' })).toBeInTheDocument()
    await view.rerender({ year: 2025, month: 12, today: new Date(2025, 11, 9), locale: 'en-US', onNavigate })
    expect(screen.getByRole('heading', { name: 'December 2025' })).toBeInTheDocument()
  })
})
