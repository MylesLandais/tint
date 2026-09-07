import { describe, expect, it } from 'vitest'
import {
  buildMonthGrid,
  buildWeekSpans,
  dedupeEvents,
  enumerateDateKeys,
  eventDateRange,
  eventsOverlap,
  isMultiDay,
  nextCalendarMonth,
  previousCalendarMonth,
  toDateKey,
  type CalendarEvent,
} from './contracts'

function event(partial: Partial<CalendarEvent> & { id: string }): CalendarEvent {
  return {
    title: partial.id,
    start: '2026-03-10T09:00:00',
    end: '2026-03-10T10:00:00',
    ...partial,
  }
}

/** March 2026 starts on a Sunday, so the grid needs no leading padding. */
const MARCH_2026 = { year: 2026, month: 3 }

describe('eventDateRange', () => {
  it('treats an all-day DTEND as exclusive, per RFC 5545', () => {
    const single = event({ id: 'a', allDay: true, start: '2026-03-03', end: '2026-03-04' })
    expect(eventDateRange(single)).toEqual({ startKey: '2026-03-03', endKey: '2026-03-03' })

    const threeDays = event({ id: 'b', allDay: true, start: '2026-03-03', end: '2026-03-06' })
    expect(eventDateRange(threeDays)).toEqual({ startKey: '2026-03-03', endKey: '2026-03-05' })
  })

  it('does not let a degenerate all-day range invert', () => {
    const same = event({ id: 'c', allDay: true, start: '2026-03-03', end: '2026-03-03' })
    expect(eventDateRange(same)).toEqual({ startKey: '2026-03-03', endKey: '2026-03-03' })
  })

  it('attributes a midnight end to the previous day', () => {
    // A 09:00 -> 00:00 shift touches the 11th for zero seconds; it is one day.
    const shift = event({ id: 'd', start: '2026-03-10T09:00:00', end: '2026-03-11T00:00:00' })
    expect(eventDateRange(shift)).toEqual({ startKey: '2026-03-10', endKey: '2026-03-10' })
    expect(isMultiDay(shift)).toBe(false)
  })

  it('keeps a timed event that genuinely crosses midnight as two days', () => {
    const overnight = event({ id: 'e', start: '2026-03-10T22:00:00', end: '2026-03-11T02:00:00' })
    expect(eventDateRange(overnight)).toEqual({ startKey: '2026-03-10', endKey: '2026-03-11' })
    expect(isMultiDay(overnight)).toBe(true)
  })
})

describe('enumerateDateKeys', () => {
  it('is inclusive at both ends', () => {
    expect(enumerateDateKeys('2026-03-03', '2026-03-05')).toEqual([
      '2026-03-03',
      '2026-03-04',
      '2026-03-05',
    ])
  })

  it('crosses a month boundary', () => {
    expect(enumerateDateKeys('2026-02-27', '2026-03-02')).toEqual([
      '2026-02-27',
      '2026-02-28',
      '2026-03-01',
      '2026-03-02',
    ])
  })

  it('crosses a leap day', () => {
    expect(enumerateDateKeys('2024-02-28', '2024-03-01')).toEqual([
      '2024-02-28',
      '2024-02-29',
      '2024-03-01',
    ])
  })
})

describe('buildWeekSpans', () => {
  const week = enumerateDateKeys('2026-03-01', '2026-03-07')

  it('places the longest event in the top lane regardless of input order', () => {
    const short = event({ id: 'short', allDay: true, start: '2026-03-02', end: '2026-03-04' })
    const long = event({ id: 'long', allDay: true, start: '2026-03-01', end: '2026-03-08' })

    // Insertion order must not decide the lane; the sliver comes first here.
    const spans = buildWeekSpans(week, [short, long])
    const byId = new Map(spans.map((span) => [span.event.id, span]))
    expect(byId.get('long')!.lane).toBe(0)
    expect(byId.get('short')!.lane).toBe(1)
  })

  it('reuses a lane when two events do not overlap', () => {
    const early = event({ id: 'early', allDay: true, start: '2026-03-01', end: '2026-03-03' })
    const late = event({ id: 'late', allDay: true, start: '2026-03-05', end: '2026-03-07' })
    const spans = buildWeekSpans(week, [early, late])
    expect(spans.map((span) => span.lane)).toEqual([0, 0])
  })

  it('ignores single-day events', () => {
    expect(buildWeekSpans(week, [event({ id: 'point' })])).toEqual([])
  })

  it('clips to the week and reports which edges continue', () => {
    const straddling = event({ id: 'x', allDay: true, start: '2026-02-25', end: '2026-03-10' })
    const [span] = buildWeekSpans(week, [straddling])
    expect(span).toMatchObject({
      colStart: 0,
      colEnd: 6,
      continuesFromPrev: true,
      continuesToNext: true,
    })
  })

  it('does not mark a flush edge as continuing', () => {
    const exact = event({ id: 'y', allDay: true, start: '2026-03-01', end: '2026-03-08' })
    const [span] = buildWeekSpans(week, [exact])
    expect(span).toMatchObject({ continuesFromPrev: false, continuesToNext: false })
  })
})

describe('buildMonthGrid', () => {
  const today = new Date(2026, 2, 15)

  it('pads to whole weeks and marks days outside the month', () => {
    // April 2026 starts on a Wednesday, so the first row has three padded days.
    const grid = buildMonthGrid(2026, 4, [], { today })
    for (const week of grid.weeks) expect(week.days).toHaveLength(7)
    expect(grid.weeks[0]!.days.slice(0, 3).every((day) => !day.inMonth)).toBe(true)
    expect(grid.weeks[0]!.days[3]).toMatchObject({ day: 1, inMonth: true })
  })

  it('honours weekStart', () => {
    const sunday = buildMonthGrid(2026, 4, [], { today })
    const monday = buildMonthGrid(2026, 4, [], { today, weekStart: 1 })
    expect(sunday.weeks[0]!.days[0]!.date).not.toEqual(monday.weeks[0]!.days[0]!.date)
    expect(monday.weeks[0]!.days.filter((day) => !day.inMonth)).toHaveLength(2)
  })

  it('routes single-day events to cells and multi-day ones to spans', () => {
    const point = event({ id: 'point', start: '2026-03-10T09:00:00', end: '2026-03-10T10:00:00' })
    const range = event({ id: 'range', allDay: true, start: '2026-03-10', end: '2026-03-13' })
    const grid = buildMonthGrid(MARCH_2026.year, MARCH_2026.month, [point, range], { today })

    const cells = grid.weeks.flatMap((week) => week.days)
    const tenth = cells.find((day) => day.date === '2026-03-10')!
    expect(tenth.events.map((e) => e.id)).toEqual(['point'])

    const spans = grid.weeks.flatMap((week) => week.spans)
    expect(spans.map((span) => span.event.id)).toEqual(['range'])
  })

  it('splits a span that crosses a week boundary into one per week', () => {
    // 2026-03-07 is a Saturday, so this crosses into the following row.
    const crossing = event({ id: 'cross', allDay: true, start: '2026-03-05', end: '2026-03-11' })
    const grid = buildMonthGrid(MARCH_2026.year, MARCH_2026.month, [crossing], { today })
    const weeksWithSpan = grid.weeks.filter((week) => week.spans.length > 0)
    expect(weeksWithSpan).toHaveLength(2)
    expect(weeksWithSpan[0]!.spans[0]!.continuesToNext).toBe(true)
    expect(weeksWithSpan[1]!.spans[0]!.continuesFromPrev).toBe(true)
  })

  it('reports the lane count each week needs', () => {
    const a = event({ id: 'a', allDay: true, start: '2026-03-02', end: '2026-03-05' })
    const b = event({ id: 'b', allDay: true, start: '2026-03-03', end: '2026-03-06' })
    const grid = buildMonthGrid(MARCH_2026.year, MARCH_2026.month, [a, b], { today })
    // Both land in the first row (March 2026 opens on a Sunday), overlapping,
    // so that week needs two lanes and the quiet weeks reserve none.
    expect(grid.weeks[0]!.spanLaneCount).toBe(2)
    expect(grid.weeks.at(-1)!.spanLaneCount).toBe(0)
  })

  it('marks today, and only when it falls inside the rendered grid', () => {
    const march = buildMonthGrid(MARCH_2026.year, MARCH_2026.month, [], { today })
    const flagged = march.weeks.flatMap((w) => w.days).filter((day) => day.isToday)
    expect(flagged.map((day) => day.date)).toEqual(['2026-03-15'])

    const july = buildMonthGrid(2026, 7, [], { today })
    expect(july.weeks.flatMap((w) => w.days).some((day) => day.isToday)).toBe(false)
  })

  it('is stable across a DST transition', () => {
    // US DST begins 2026-03-08. Every March day must still appear exactly once.
    const grid = buildMonthGrid(MARCH_2026.year, MARCH_2026.month, [], { today })
    const inMonth = grid.weeks.flatMap((w) => w.days).filter((day) => day.inMonth)
    expect(inMonth).toHaveLength(31)
    expect(new Set(inMonth.map((day) => day.date)).size).toBe(31)
    expect(inMonth[7]!.date).toBe('2026-03-08')
  })
})

describe('dedupeEvents', () => {
  const real = event({ id: 'real', title: 'Standup', allDay: true, start: '2026-03-03', end: '2026-03-04' })

  it('drops a candidate matching an existing title on overlapping days', () => {
    const proposed = event({ id: 'proposed', title: '  standup ', allDay: true, start: '2026-03-03', end: '2026-03-04' })
    expect(dedupeEvents([real], [proposed]).map((e) => e.id)).toEqual(['real'])
  })

  it('keeps a same-titled candidate on different days', () => {
    const later = event({ id: 'later', title: 'Standup', allDay: true, start: '2026-03-20', end: '2026-03-21' })
    expect(dedupeEvents([real], [later]).map((e) => e.id)).toEqual(['real', 'later'])
  })

  it('keeps a differently-titled candidate on the same day', () => {
    const other = event({ id: 'other', title: 'Retro', allDay: true, start: '2026-03-03', end: '2026-03-04' })
    expect(dedupeEvents([real], [other]).map((e) => e.id)).toEqual(['real', 'other'])
  })
})

describe('month arithmetic', () => {
  it('wraps across year boundaries', () => {
    expect(previousCalendarMonth(2026, 1)).toEqual({ year: 2025, month: 12 })
    expect(nextCalendarMonth(2026, 12)).toEqual({ year: 2027, month: 1 })
    expect(previousCalendarMonth(2026, 3)).toEqual({ year: 2026, month: 2 })
    expect(nextCalendarMonth(2026, 3)).toEqual({ year: 2026, month: 4 })
  })
})

describe('toDateKey', () => {
  it('uses local fields, not UTC', () => {
    // 23:30 local on the 10th is the 11th in UTC for negative offsets; the key
    // must follow the wall clock the grid is drawn in.
    expect(toDateKey(new Date(2026, 2, 10, 23, 30))).toBe('2026-03-10')
  })

  it('zero-pads', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('eventsOverlap', () => {
  it('is true for touching ranges and false for adjacent ones', () => {
    const a = event({ id: 'a', allDay: true, start: '2026-03-01', end: '2026-03-04' })
    const b = event({ id: 'b', allDay: true, start: '2026-03-03', end: '2026-03-06' })
    const c = event({ id: 'c', allDay: true, start: '2026-03-04', end: '2026-03-06' })
    expect(eventsOverlap(a, b)).toBe(true)
    expect(eventsOverlap(a, c)).toBe(false)
  })
})
