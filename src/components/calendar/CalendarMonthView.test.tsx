import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CalendarMonthView } from './CalendarMonthView'
import type { CalendarEvent } from './contracts'

const TODAY = new Date(2026, 2, 15)

function cell(date: string) {
  return document.querySelector(`[data-date="${date}"]`) as HTMLElement
}

const events: CalendarEvent[] = [
  { id: 'standup', title: 'Standup', start: '2026-03-10T09:00:00', end: '2026-03-10T09:15:00' },
  { id: 'offsite', title: 'Offsite', allDay: true, start: '2026-03-03', end: '2026-03-06' },
]

describe('CalendarMonthView', () => {
  it('renders a labelled grid with weekday headers', () => {
    render(<CalendarMonthView year={2026} month={3} events={[]} today={TODAY} label="March" />)
    expect(screen.getByRole('grid', { name: 'March' })).toBeInTheDocument()
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ])
  })

  it('rotates the weekday headers for a Monday start', () => {
    render(<CalendarMonthView year={2026} month={3} events={[]} today={TODAY} weekStart={1} />)
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent)
    expect(headers[0]).toBe('Mon')
    expect(headers[6]).toBe('Sun')
  })

  it('puts a single-day event in its own cell', () => {
    render(<CalendarMonthView year={2026} month={3} events={events} today={TODAY} />)
    expect(within(cell('2026-03-10')).getByText('Standup')).toBeInTheDocument()
  })

  it('renders a multi-day event once as a span, not once per day', () => {
    render(<CalendarMonthView year={2026} month={3} events={events} today={TODAY} />)
    // The offsite covers the 3rd-5th but must appear a single time.
    expect(screen.getAllByText('Offsite')).toHaveLength(1)
    expect(document.querySelectorAll('[data-tint-calendar-span]')).toHaveLength(1)
  })

  it('collapses beyond maxEventsPerDay', () => {
    const many: CalendarEvent[] = Array.from({ length: 5 }, (_, index) => ({
      id: `e${index}`,
      title: `Event ${index}`,
      start: '2026-03-10T09:00:00',
      end: '2026-03-10T10:00:00',
    }))
    render(
      <CalendarMonthView year={2026} month={3} events={many} today={TODAY} maxEventsPerDay={3} />,
    )
    expect(within(cell('2026-03-10')).getByText('+2 more')).toBeInTheDocument()
  })

  it('marks today', () => {
    render(<CalendarMonthView year={2026} month={3} events={[]} today={TODAY} />)
    expect(cell('2026-03-15').textContent).toContain('15')
    const flagged = document.querySelectorAll('[data-tint-calendar-day] .bg-tint-accent')
    expect(flagged.length).toBeGreaterThan(0)
  })

  it('reports date selection', () => {
    const onSelectDate = vi.fn()
    render(
      <CalendarMonthView year={2026} month={3} events={[]} today={TODAY} onSelectDate={onSelectDate} />,
    )
    fireEvent.click(cell('2026-03-12'))
    expect(onSelectDate).toHaveBeenCalledWith('2026-03-12')
  })

  it('activates a day from the keyboard when selectable', () => {
    const onSelectDate = vi.fn()
    render(
      <CalendarMonthView year={2026} month={3} events={[]} today={TODAY} onSelectDate={onSelectDate} />,
    )
    fireEvent.keyDown(cell('2026-03-12'), { key: 'Enter' })
    expect(onSelectDate).toHaveBeenCalledWith('2026-03-12')
  })

  it('is not focusable or clickable when no date handler is given', () => {
    render(<CalendarMonthView year={2026} month={3} events={[]} today={TODAY} />)
    expect(cell('2026-03-12')).not.toHaveAttribute('tabindex')
  })

  it('selecting an event does not also select its day', () => {
    const onSelectDate = vi.fn()
    const onSelectEvent = vi.fn()
    render(
      <CalendarMonthView
        year={2026}
        month={3}
        events={events}
        today={TODAY}
        onSelectDate={onSelectDate}
        onSelectEvent={onSelectEvent}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Standup' }))
    expect(onSelectEvent).toHaveBeenCalledWith(expect.objectContaining({ id: 'standup' }))
    expect(onSelectDate).not.toHaveBeenCalled()
  })

  it('exposes source and status for host theming', () => {
    render(
      <CalendarMonthView
        year={2026}
        month={3}
        today={TODAY}
        events={[
          {
            id: 'x',
            title: 'Proposed',
            source: 'email-suggestion',
            status: 'tentative',
            start: '2026-03-10T09:00:00',
            end: '2026-03-10T10:00:00',
          },
        ]}
      />,
    )
    const chip = document.querySelector('[data-tint-calendar-event]')!
    expect(chip).toHaveAttribute('data-source', 'email-suggestion')
    expect(chip).toHaveAttribute('data-status', 'tentative')
  })

  it('honours renderEvent and renderSpan', () => {
    render(
      <CalendarMonthView
        year={2026}
        month={3}
        events={events}
        today={TODAY}
        renderEvent={(event) => <em>custom {event.title}</em>}
        renderSpan={(span) => <em>bar {span.event.title}</em>}
      />,
    )
    expect(screen.getByText('custom Standup')).toBeInTheDocument()
    expect(screen.getByText('bar Offsite')).toBeInTheDocument()
  })
})
