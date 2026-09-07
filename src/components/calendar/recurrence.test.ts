import { describe, expect, it } from 'vitest'
import { parseICalendar } from './ical'
import {
  expandCalendarEvents,
  expandRecurrence,
  parseRecurrenceRule,
  type RecurrenceWindow,
} from './recurrence'

/** Local `YYYY-MM-DD`, so assertions read as dates rather than instants. */
function keys(dates: Date[]): string[] {
  const pad = (value: number) => String(value).padStart(2, '0')
  return dates.map((d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`)
}

function windowOf(from: string, to: string): RecurrenceWindow {
  return { from: new Date(`${from}T00:00:00`), to: new Date(`${to}T23:59:59`) }
}

function expand(rrule: string, seedIso: string, window: RecurrenceWindow) {
  const rule = parseRecurrenceRule(rrule)
  expect(rule).not.toBeNull()
  return keys(expandRecurrence(new Date(seedIso), rule!, window))
}

describe('parseRecurrenceRule', () => {
  it('reads the common parts', () => {
    const rule = parseRecurrenceRule('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR;COUNT=10;WKST=SU')
    expect(rule).toMatchObject({ freq: 'WEEKLY', interval: 2, count: 10, weekStart: 0 })
    expect(rule!.byDay).toEqual([{ weekday: 1 }, { weekday: 3 }, { weekday: 5 }])
  })

  it('reads BYDAY ordinals, including negative', () => {
    expect(parseRecurrenceRule('FREQ=MONTHLY;BYDAY=3MO')!.byDay).toEqual([
      { weekday: 1, ordinal: 3 },
    ])
    expect(parseRecurrenceRule('FREQ=MONTHLY;BYDAY=-1FR')!.byDay).toEqual([
      { weekday: 5, ordinal: -1 },
    ])
  })

  it('rejects a frequency it cannot honour rather than guessing', () => {
    expect(parseRecurrenceRule('FREQ=HOURLY;INTERVAL=2')).toBeNull()
    expect(parseRecurrenceRule('INTERVAL=2')).toBeNull()
  })

  it('reports rule parts it does not implement', () => {
    expect(parseRecurrenceRule('FREQ=YEARLY;BYWEEKNO=20')!.unsupported).toEqual(['BYWEEKNO'])
    expect(parseRecurrenceRule('FREQ=DAILY')!.unsupported).toEqual([])
  })

  it('defaults INTERVAL to 1 and never to 0', () => {
    expect(parseRecurrenceRule('FREQ=DAILY')!.interval).toBe(1)
    expect(parseRecurrenceRule('FREQ=DAILY;INTERVAL=0')!.interval).toBe(1)
  })
})

describe('expandRecurrence', () => {
  it('expands a daily rule with an interval', () => {
    expect(expand('FREQ=DAILY;INTERVAL=3', '2026-03-02T09:00:00', windowOf('2026-03-01', '2026-03-12'))).toEqual([
      '2026-03-02',
      '2026-03-05',
      '2026-03-08',
      '2026-03-11',
    ])
  })

  it('honours COUNT', () => {
    expect(expand('FREQ=DAILY;COUNT=3', '2026-03-02T09:00:00', windowOf('2026-03-01', '2026-03-31'))).toEqual([
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
    ])
  })

  it('honours UNTIL', () => {
    expect(
      expand('FREQ=DAILY;UNTIL=20260305T235959Z', '2026-03-02T09:00:00', windowOf('2026-03-01', '2026-03-31')),
    ).toEqual(['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05'])
  })

  it('expands every other week on MO, WE, FR (RFC 5545 example)', () => {
    expect(
      expand('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR;WKST=SU', '2026-03-02T09:00:00', windowOf('2026-03-01', '2026-03-21')),
    ).toEqual([
      // Week of Mar 1; then Mar 8-14 is skipped; then the week of Mar 15.
      '2026-03-02',
      '2026-03-04',
      '2026-03-06',
      '2026-03-16',
      '2026-03-18',
      '2026-03-20',
    ])
  })

  it('expands the first Friday of each month', () => {
    expect(expand('FREQ=MONTHLY;BYDAY=1FR', '2026-03-06T09:00:00', windowOf('2026-03-01', '2026-06-30'))).toEqual([
      '2026-03-06',
      '2026-04-03',
      '2026-05-01',
      '2026-06-05',
    ])
  })

  it('expands the last Friday of each month', () => {
    expect(expand('FREQ=MONTHLY;BYDAY=-1FR', '2026-03-27T09:00:00', windowOf('2026-03-01', '2026-05-31'))).toEqual([
      '2026-03-27',
      '2026-04-24',
      '2026-05-29',
    ])
  })

  it('expands the last day of each month via a negative BYMONTHDAY', () => {
    expect(expand('FREQ=MONTHLY;BYMONTHDAY=-1', '2026-01-31T09:00:00', windowOf('2026-01-01', '2026-04-30'))).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
    ])
  })

  it('skips months with no 31st rather than sliding into the next one', () => {
    expect(expand('FREQ=MONTHLY;BYMONTHDAY=31', '2026-01-31T09:00:00', windowOf('2026-01-01', '2026-05-31'))).toEqual([
      '2026-01-31',
      '2026-03-31',
      '2026-05-31',
    ])
  })

  it('expands the last workday of each month via BYSETPOS', () => {
    expect(
      expand('FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1', '2026-01-30T09:00:00', windowOf('2026-01-01', '2026-04-30')),
    ).toEqual([
      '2026-01-30', // Friday
      '2026-02-27', // Friday
      '2026-03-31', // Tuesday
      '2026-04-30', // Thursday
    ])
  })

  it('expands US Thanksgiving — yearly, 4th Thursday of November', () => {
    expect(
      expand('FREQ=YEARLY;BYMONTH=11;BYDAY=4TH', '2026-11-26T09:00:00', windowOf('2026-01-01', '2029-12-31')),
    ).toEqual(['2026-11-26', '2027-11-25', '2028-11-23', '2029-11-22'])
  })

  it('clips to the window without shifting the sequence', () => {
    // The rule starts in March; asking only about April must not re-anchor it.
    expect(expand('FREQ=DAILY;INTERVAL=7', '2026-03-02T09:00:00', windowOf('2026-04-01', '2026-04-30'))).toEqual([
      '2026-04-06',
      '2026-04-13',
      '2026-04-20',
      '2026-04-27',
    ])
  })

  it('never emits occurrences before the seed', () => {
    expect(expand('FREQ=DAILY', '2026-03-10T09:00:00', windowOf('2026-03-01', '2026-03-12'))).toEqual([
      '2026-03-10',
      '2026-03-11',
      '2026-03-12',
    ])
  })

  it('preserves the seed clock time across occurrences', () => {
    const rule = parseRecurrenceRule('FREQ=DAILY;COUNT=2')!
    const [, second] = expandRecurrence(new Date('2026-03-02T14:45:00'), rule, windowOf('2026-03-01', '2026-03-31'))
    expect(second!.getHours()).toBe(14)
    expect(second!.getMinutes()).toBe(45)
  })

  it('terminates on an unbounded rule, bounded by the window', () => {
    const result = expand('FREQ=DAILY', '2020-01-01T09:00:00', windowOf('2026-03-01', '2026-03-03'))
    expect(result).toEqual(['2026-03-01', '2026-03-02', '2026-03-03'])
  })
})

describe('expandCalendarEvents', () => {
  const VCAL = (body: string[]) =>
    ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//t//EN', ...body, 'END:VCALENDAR'].join('\r\n')

  function run(body: string[], window = windowOf('2026-03-01', '2026-03-31')) {
    return expandCalendarEvents(parseICalendar(VCAL(body)), window)
  }

  it('passes a non-recurring event through once', () => {
    const events = run([
      'BEGIN:VEVENT',
      'UID:one',
      'DTSTART:20260310T090000Z',
      'DTEND:20260310T100000Z',
      'SUMMARY:Single',
      'END:VEVENT',
    ])
    expect(events).toHaveLength(1)
    expect(events[0]!.id).toBe('one')
  })

  it('expands a weekly rule into distinct instances', () => {
    const events = run([
      'BEGIN:VEVENT',
      'UID:weekly',
      'DTSTART:20260302T090000Z',
      'DTEND:20260302T093000Z',
      'RRULE:FREQ=WEEKLY;BYDAY=MO',
      'SUMMARY:Standup',
      'END:VEVENT',
    ])
    expect(events.map((event) => event.start.slice(0, 10))).toEqual([
      '2026-03-02',
      '2026-03-09',
      '2026-03-16',
      '2026-03-23',
      '2026-03-30',
    ])
    // Ids must be unique or selection and React keys collide.
    expect(new Set(events.map((event) => event.id)).size).toBe(events.length)
  })

  it('preserves each instance duration', () => {
    const [first] = run([
      'BEGIN:VEVENT',
      'UID:dur',
      'DTSTART:20260302T090000Z',
      'DTEND:20260302T101500Z',
      'RRULE:FREQ=WEEKLY;BYDAY=MO',
      'SUMMARY:Long',
      'END:VEVENT',
    ])
    expect(new Date(first!.end).getTime() - new Date(first!.start).getTime()).toBe(75 * 60 * 1000)
  })

  it('removes an EXDATE instance', () => {
    const events = run([
      'BEGIN:VEVENT',
      'UID:ex',
      'DTSTART:20260302T090000Z',
      'DTEND:20260302T093000Z',
      'RRULE:FREQ=WEEKLY;BYDAY=MO',
      'EXDATE:20260316T090000Z',
      'SUMMARY:Standup',
      'END:VEVENT',
    ])
    expect(events.map((event) => event.start.slice(0, 10))).not.toContain('2026-03-16')
    expect(events).toHaveLength(4)
  })

  it('adds an RDATE instance', () => {
    const events = run([
      'BEGIN:VEVENT',
      'UID:rd',
      'DTSTART:20260302T090000Z',
      'DTEND:20260302T093000Z',
      'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=1',
      'RDATE:20260320T090000Z',
      'SUMMARY:Standup',
      'END:VEVENT',
    ])
    expect(events.map((event) => event.start.slice(0, 10))).toEqual(['2026-03-02', '2026-03-20'])
  })

  it('replaces an instance with its RECURRENCE-ID override, without duplicating it', () => {
    const events = run([
      'BEGIN:VEVENT',
      'UID:ov',
      'DTSTART:20260302T090000Z',
      'DTEND:20260302T093000Z',
      'RRULE:FREQ=WEEKLY;BYDAY=MO',
      'SUMMARY:Standup',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:ov',
      'RECURRENCE-ID:20260316T090000Z',
      'DTSTART:20260317T140000Z',
      'DTEND:20260317T143000Z',
      'SUMMARY:Standup (moved)',
      'END:VEVENT',
    ])
    const titles = events.map((event) => event.title)
    expect(titles.filter((title) => title === 'Standup (moved)')).toHaveLength(1)
    expect(events).toHaveLength(5)
    const moved = events.find((event) => event.title === 'Standup (moved)')!
    expect(moved.start.slice(0, 10)).toBe('2026-03-17')
    // And the original slot is gone.
    expect(events.filter((event) => event.start.slice(0, 10) === '2026-03-16')).toHaveLength(0)
  })

  it('keeps a UTC-anchored series on its UTC clock across a DST boundary', () => {
    /*
     * The regression this locks in: expansion used to preserve the *viewer's*
     * local wall clock, so every instance after the 2026-03-08 US transition
     * moved by an hour, and an EXDATE naming the true instant stopped matching.
     * A 09:00Z series is 09:00Z on both sides of the boundary.
     */
    const events = run([
      'BEGIN:VEVENT',
      'UID:dst',
      'DTSTART:20260302T090000Z',
      'DTEND:20260302T093000Z',
      'RRULE:FREQ=WEEKLY;BYDAY=MO',
      'SUMMARY:Across DST',
      'END:VEVENT',
    ])
    const utcTimes = events.map((event) => new Date(event.start).toISOString().slice(11, 19))
    expect(new Set(utcTimes)).toEqual(new Set(['09:00:00']))
  })

  it('keeps a zoned series on its own wall clock across that zone\'s DST boundary', () => {
    // Europe/Oslo springs forward 2026-03-29, so a 09:00 Oslo series stays at
    // 09:00 Oslo — which means its UTC time shifts, the opposite of the above.
    const events = expandCalendarEvents(
      parseICalendar(
        VCAL([
          'BEGIN:VEVENT',
          'UID:oslo',
          'DTSTART;TZID=Europe/Oslo:20260323T090000',
          'DTEND;TZID=Europe/Oslo:20260323T093000',
          'RRULE:FREQ=WEEKLY;BYDAY=MO',
          'SUMMARY:Oslo standup',
          'END:VEVENT',
        ]),
      ),
      windowOf('2026-03-23', '2026-04-06'),
    )
    const osloWall = events.map((event) =>
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Oslo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(event.start)),
    )
    expect(new Set(osloWall)).toEqual(new Set(['09:00']))
    // And the UTC readings genuinely differ either side of the transition.
    const utc = events.map((event) => new Date(event.start).toISOString().slice(11, 16))
    expect(new Set(utc).size).toBe(2)
  })

  it('expands an all-day recurring event as whole days', () => {
    const events = run([
      'BEGIN:VEVENT',
      'UID:allday',
      'DTSTART;VALUE=DATE:20260302',
      'DTEND;VALUE=DATE:20260304',
      'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=2',
      'SUMMARY:Two-day block',
      'END:VEVENT',
    ])
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({ start: '2026-03-02', end: '2026-03-04', allDay: true })
    expect(events[1]).toMatchObject({ start: '2026-03-09', end: '2026-03-11' })
  })
})
