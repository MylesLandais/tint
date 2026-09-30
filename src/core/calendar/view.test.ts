import { describe, expect, it } from 'vitest'
import { buildMonthGrid } from './contracts'
import { calendarMonthLabel, calendarMonthOf, calendarWeekdayLabels, visibleDayEvents } from './view'

describe('calendar view projection', () => {
  it('rotates weekday labels to match the same month grid columns', () => {
    const grid = buildMonthGrid(2026, 3, [], { weekStart: 1, today: new Date(2026, 2, 15) })
    expect(calendarWeekdayLabels(1)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    expect(grid.weeks[0].days[0].date).toBe('2026-02-23')
  })

  it('limits each day without mutating its events', () => {
    const events = Array.from({ length: 4 }, (_, index) => ({
      id: String(index), title: String(index), start: '2026-03-10T09:00:00', end: '2026-03-10T10:00:00',
    }))
    const day = buildMonthGrid(2026, 3, events, { today: new Date(2026, 2, 15) })
      .weeks.flatMap((week) => week.days).find(({ date }) => date === '2026-03-10')!
    const result = visibleDayEvents(day, 2)
    expect(result.shown.map(({ id }) => id)).toEqual(['0', '1'])
    expect(result.hidden).toBe(2)
    expect(day.events).toHaveLength(4)
  })

  it('formats the toolbar label and injected today month', () => {
    expect(calendarMonthLabel(2026, 3, 'en-US')).toBe('March 2026')
    expect(calendarMonthOf(new Date(2026, 0, 31))).toEqual({ year: 2026, month: 1 })
  })
})
