import { describe, expect, it } from 'vitest'
import {
  calendarEventToICal,
  escapeText,
  formatICalDate,
  icalEventToCalendarEvent,
  parseCalendarEvents,
  parseContentLine,
  parseDuration,
  parseICalendar,
  toICalendar,
  unescapeText,
  unfoldLines,
} from './ical'

const VCALENDAR = (body: string) =>
  ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//test//EN', body, 'END:VCALENDAR'].join('\r\n')

describe('unfoldLines', () => {
  it('rejoins continuation lines', () => {
    expect(unfoldLines('SUMMARY:a long\r\n  value')).toEqual(['SUMMARY:a long value'])
  })

  it('accepts a tab as the continuation marker', () => {
    expect(unfoldLines('SUMMARY:one\r\n\ttwo')).toEqual(['SUMMARY:onetwo'])
  })

  it('accepts bare LF, which real feeds emit', () => {
    expect(unfoldLines('A:1\nB:2')).toEqual(['A:1', 'B:2'])
  })
})

describe('parseContentLine', () => {
  it('splits name, params, and value', () => {
    expect(parseContentLine('DTSTART;TZID=Europe/Oslo:20260303T090000')).toEqual({
      name: 'DTSTART',
      params: { TZID: 'Europe/Oslo' },
      value: '20260303T090000',
    })
  })

  it('does not split on a colon inside a quoted parameter', () => {
    const parsed = parseContentLine('X-THING;ID="a:b":payload')
    expect(parsed).toMatchObject({ name: 'X-THING', value: 'payload' })
    expect(parsed!.params.ID).toBe('a:b')
  })

  it('does not split params on a semicolon inside a quoted value', () => {
    const parsed = parseContentLine('X;A="p;q";B=r:v')
    expect(parsed!.params).toEqual({ A: 'p;q', B: 'r' })
  })

  it('uppercases the property name', () => {
    expect(parseContentLine('summary:hi')!.name).toBe('SUMMARY')
  })
})

describe('TEXT escaping', () => {
  it('round-trips', () => {
    const raw = 'Lunch; with A, B\\C\nand a second line'
    expect(unescapeText(escapeText(raw))).toBe(raw)
  })

  it('reads both \\n and \\N as a newline', () => {
    expect(unescapeText('a\\nb\\Nc')).toBe('a\nb\nc')
  })
})

describe('parseDuration', () => {
  it('reads the compound form', () => {
    expect(parseDuration('P1DT2H30M')).toBe((86400 + 7200 + 1800) * 1000)
  })

  it('reads weeks and negatives', () => {
    expect(parseDuration('P2W')).toBe(1209600000)
    expect(parseDuration('-PT15M')).toBe(-900000)
  })

  it('returns 0 for nonsense rather than NaN', () => {
    expect(parseDuration('banana')).toBe(0)
  })
})

describe('parseICalendar', () => {
  it('finds each VEVENT', () => {
    const text = VCALENDAR(
      [
        'BEGIN:VEVENT',
        'UID:1',
        'DTSTART:20260303T090000Z',
        'SUMMARY:One',
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:2',
        'DTSTART:20260304T090000Z',
        'SUMMARY:Two',
        'END:VEVENT',
      ].join('\r\n'),
    )
    expect(parseICalendar(text)).toHaveLength(2)
  })

  it('does not read a nested VALARM DTSTART as the event start', () => {
    const text = VCALENDAR(
      [
        'BEGIN:VEVENT',
        'UID:1',
        'DTSTART:20260303T090000Z',
        'SUMMARY:With alarm',
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'DTSTART:19700101T000000Z',
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n'),
    )
    const [event] = parseICalendar(text)
    expect(event!.all('DTSTART')).toHaveLength(1)
    expect(event!.get('DTSTART')!.value).toBe('20260303T090000Z')
  })
})

describe('icalEventToCalendarEvent', () => {
  const first = (body: string) => {
    const [event] = parseICalendar(VCALENDAR(['BEGIN:VEVENT', body, 'END:VEVENT'].join('\r\n')))
    return icalEventToCalendarEvent(event!)
  }

  it('maps an all-day event and keeps DTEND exclusive', () => {
    const event = first(['UID:a', 'DTSTART;VALUE=DATE:20260303', 'DTEND;VALUE=DATE:20260306', 'SUMMARY:Offsite'].join('\r\n'))
    expect(event).toMatchObject({
      id: 'a',
      title: 'Offsite',
      start: '2026-03-03',
      end: '2026-03-06',
      allDay: true,
    })
  })

  it('defaults a bare all-day event to one day', () => {
    const event = first(['UID:b', 'DTSTART;VALUE=DATE:20260303', 'SUMMARY:Holiday'].join('\r\n'))
    expect(event).toMatchObject({ start: '2026-03-03', end: '2026-03-04' })
  })

  it('applies DURATION when DTEND is absent', () => {
    const event = first(['UID:c', 'DTSTART:20260303T090000Z', 'DURATION:PT90M', 'SUMMARY:Sync'].join('\r\n'))
    const span = new Date(event!.end).getTime() - new Date(event!.start).getTime()
    expect(span).toBe(90 * 60 * 1000)
  })

  it('converts UTC to the local wall clock', () => {
    const event = first(['UID:d', 'DTSTART:20260303T090000Z', 'DTEND:20260303T100000Z', 'SUMMARY:Z'].join('\r\n'))
    // Whatever the runner's zone, the parsed instant must be the stated one.
    expect(new Date(event!.start).toISOString()).toBe('2026-03-03T09:00:00.000Z')
  })

  it('resolves TZID against the IANA database', () => {
    const event = first(
      ['UID:e', 'DTSTART;TZID=Europe/Oslo:20260303T090000', 'DTEND;TZID=Europe/Oslo:20260303T100000', 'SUMMARY:Oslo'].join('\r\n'),
    )
    // Oslo is UTC+1 in March before the last Sunday, so 09:00 local is 08:00Z.
    expect(new Date(event!.start).toISOString()).toBe('2026-03-03T08:00:00.000Z')
  })

  it('falls back to floating rather than dropping an unknown TZID', () => {
    const event = first(['UID:f', 'DTSTART;TZID=Mars/Olympus:20260303T090000', 'SUMMARY:Mars'].join('\r\n'))
    expect(event!.start).toBe('2026-03-03T09:00:00')
  })

  it('unescapes text properties', () => {
    const event = first(['UID:g', 'DTSTART:20260303T090000Z', 'SUMMARY:Lunch\\, then talk', 'DESCRIPTION:a\\nb'].join('\r\n'))
    expect(event!.title).toBe('Lunch, then talk')
    expect(event!.description).toBe('a\nb')
  })

  it('maps STATUS', () => {
    const event = first(['UID:h', 'DTSTART:20260303T090000Z', 'SUMMARY:X', 'STATUS:CANCELLED'].join('\r\n'))
    expect(event!.status).toBe('cancelled')
  })

  it('returns null without a DTSTART', () => {
    const event = first(['UID:i', 'SUMMARY:No start'].join('\r\n'))
    expect(event).toBeNull()
  })

  it('tags events with the supplied source', () => {
    const events = parseCalendarEvents(
      VCALENDAR(['BEGIN:VEVENT', 'UID:j', 'DTSTART:20260303T090000Z', 'SUMMARY:S', 'END:VEVENT'].join('\r\n')),
      { source: 'work' },
    )
    expect(events[0]!.source).toBe('work')
  })
})

describe('serialisation', () => {
  it('round-trips an all-day event', () => {
    const original = {
      id: 'rt-1',
      title: 'Offsite; with commas, too',
      start: '2026-03-03',
      end: '2026-03-06',
      allDay: true,
    }
    const [parsed] = parseCalendarEvents(toICalendar([original]))
    expect(parsed).toMatchObject({
      id: 'rt-1',
      title: 'Offsite; with commas, too',
      start: '2026-03-03',
      end: '2026-03-06',
      allDay: true,
    })
  })

  it('round-trips a timed event through UTC', () => {
    const original = {
      id: 'rt-2',
      title: 'Sync',
      start: '2026-03-03T09:00:00',
      end: '2026-03-03T10:00:00',
      location: 'Room 2',
      status: 'tentative' as const,
    }
    const [parsed] = parseCalendarEvents(toICalendar([original]))
    expect(parsed).toMatchObject(original)
  })

  it('folds a long line at 75 octets with a leading space', () => {
    const ical = calendarEventToICal({
      id: 'long',
      title: 'x'.repeat(200),
      start: '2026-03-03T09:00:00',
      end: '2026-03-03T10:00:00',
    })
    const lines = ical.split('\r\n')
    expect(lines.every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true)
    expect(lines.filter((line) => line.startsWith(' ')).length).toBeGreaterThan(0)
    // And it must survive the round trip.
    expect(parseCalendarEvents(toICalendar([{ id: 'long', title: 'x'.repeat(200), start: '2026-03-03T09:00:00', end: '2026-03-03T10:00:00' }]))[0]!.title).toBe(
      'x'.repeat(200),
    )
  })

  it('emits CRLF line endings', () => {
    expect(toICalendar([])).toContain('\r\n')
  })

  it('formats a UTC DATE-TIME', () => {
    expect(formatICalDate(new Date(Date.UTC(2026, 2, 3, 9, 0, 0)))).toBe('20260303T090000Z')
  })
})
