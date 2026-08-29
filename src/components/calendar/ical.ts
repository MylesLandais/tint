/**
 * iCalendar (RFC 5545) parsing and serialisation for `VEVENT`, pure and
 * transport-free.
 *
 * This is the format CalDAV carries, so it is the seam between any calendar
 * server and `CalendarEvent`. It handles the parts a real feed will hit:
 * line unfolding, parameters, `TEXT` escaping, `DATE` vs `DATE-TIME`, UTC,
 * `TZID` against IANA zones, and `DURATION` in place of `DTEND`.
 *
 * Deliberately out of scope: `VTIMEZONE` blocks (the IANA database in the
 * runtime is used instead, which is what `TZID` names anyway), `VALARM`,
 * `VFREEBUSY`, `VJOURNAL`, and attendee/organizer modelling. Recurrence lives
 * in `recurrence.ts`.
 */

import type { CalendarEvent, CalendarEventStatus } from './contracts'

/** One parsed content line: `NAME;PARAM=value:VALUE`. */
export type ICalProperty = {
  name: string
  params: Record<string, string>
  value: string
}

/** A parsed `VEVENT`, before it is narrowed to a `CalendarEvent`. */
export type ICalEvent = {
  properties: readonly ICalProperty[]
  /** First property with this name, uppercased. */
  get(name: string): ICalProperty | undefined
  /** Every property with this name — `EXDATE` may repeat. */
  all(name: string): readonly ICalProperty[]
}

const MS_PER_SECOND = 1000

/**
 * Undo RFC 5545 §3.1 folding.
 *
 * A long line is split with CRLF plus one leading space or tab on each
 * continuation. Real feeds also use bare LF, so both are accepted.
 */
export function unfoldLines(text: string): string[] {
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const lines: string[] = []
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1)
    } else if (line.length > 0) {
      lines.push(line)
    }
  }
  return lines
}

/**
 * Split one content line into name, parameters, and value.
 *
 * The name/value colon is the first one that is not inside a quoted parameter
 * value — `TZID="a:b":…` is legal, and splitting on the first colon outright
 * would corrupt it.
 */
export function parseContentLine(line: string): ICalProperty | null {
  let colon = -1
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (char === '"') quoted = !quoted
    else if (char === ':' && !quoted) {
      colon = index
      break
    }
  }
  if (colon === -1) return null

  const head = line.slice(0, colon)
  const value = line.slice(colon + 1)

  const parts: string[] = []
  let current = ''
  quoted = false
  for (const char of head) {
    if (char === '"') {
      quoted = !quoted
      current += char
    } else if (char === ';' && !quoted) {
      parts.push(current)
      current = ''
    } else current += char
  }
  parts.push(current)

  const name = parts[0]!.toUpperCase()
  const params: Record<string, string> = {}
  for (const part of parts.slice(1)) {
    const equals = part.indexOf('=')
    if (equals === -1) continue
    const key = part.slice(0, equals).toUpperCase()
    const raw = part.slice(equals + 1)
    params[key] = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw
  }

  return { name, params, value }
}

/** Reverse RFC 5545 §3.3.11 TEXT escaping. */
export function unescapeText(value: string): string {
  let out = ''
  for (let index = 0; index < value.length; index++) {
    if (value[index] !== '\\') {
      out += value[index]
      continue
    }
    const next = value[++index]
    if (next === 'n' || next === 'N') out += '\n'
    else if (next === undefined) out += '\\'
    else out += next // \\ \, \; and anything else stands for itself
  }
  return out
}

/** Apply RFC 5545 §3.3.11 TEXT escaping. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * The UTC offset of an IANA zone at a given instant, in minutes.
 *
 * Derived from `Intl` rather than a bundled tz database: the runtime already
 * ships one, and it is the same database `TZID` names.
 */
/** The wall-clock fields an IANA zone shows for an instant. */
function zoneParts(instant: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts: Record<string, string> = {}
  for (const part of formatter.formatToParts(instant)) {
    if (part.type !== 'literal') parts[part.type] = part.value
  }
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    // `hour12: false` can render midnight as 24; normalise it.
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  }
}

/**
 * The UTC offset of an IANA zone at a given instant, in minutes.
 *
 * Derived from `Intl` rather than a bundled tz database: the runtime already
 * ships one, and it is the same database `TZID` names.
 */
function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const { year, month, day, hour, minute, second } = zoneParts(instant, timeZone)
  return (Date.UTC(year, month - 1, day, hour, minute, second) - instant.getTime()) / 60000
}

/**
 * Interpret a wall-clock time as being in `timeZone`, returning the instant.
 *
 * Two passes: guess using the offset at the naive instant, then re-check with
 * the offset actually in force at the guess. That second pass is what makes
 * DST boundaries come out right.
 */
function wallTimeInZone(utcMillisOfWallTime: number, timeZone: string): Date {
  const firstGuess = new Date(
    utcMillisOfWallTime - zoneOffsetMinutes(new Date(utcMillisOfWallTime), timeZone) * 60000,
  )
  const corrected = new Date(
    utcMillisOfWallTime - zoneOffsetMinutes(firstGuess, timeZone) * 60000,
  )
  return corrected
}

/**
 * The same instant expressed as a "proxy" `Date` whose *local* fields carry the
 * wall-clock reading in `timeZone`.
 *
 * Recurrence arithmetic is wall-clock arithmetic (RFC 5545 §3.3.10), so shifting
 * into this proxy space lets plain local date maths do the right thing in any
 * zone, and `fromZonedWallClock` maps the result back to a real instant.
 */
export function toZonedWallClock(instant: Date, timeZone: string): Date {
  const { year, month, day, hour, minute, second } = zoneParts(instant, timeZone)
  // Built with the *local* constructor on purpose: the proxy's local getters
  // are what the recurrence arithmetic reads.
  return new Date(year, month - 1, day, hour, minute, second)
}

/** Inverse of `toZonedWallClock`: read the proxy's local fields as `timeZone` wall time. */
export function fromZonedWallClock(proxy: Date, timeZone: string): Date {
  return wallTimeInZone(
    Date.UTC(
      proxy.getFullYear(),
      proxy.getMonth(),
      proxy.getDate(),
      proxy.getHours(),
      proxy.getMinutes(),
      proxy.getSeconds(),
    ),
    timeZone,
  )
}

function pad(value: number, width = 2): string {
  return String(value).padStart(width, '0')
}

/** Local wall clock as the `YYYY-MM-DDTHH:MM:SS` form `CalendarEvent` expects. */
function toLocalIso(date: Date): string {
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

export type ICalDateValue = {
  /** `CalendarEvent`-shaped: `YYYY-MM-DD` when `dateOnly`, else local ISO. */
  value: string
  dateOnly: boolean
  /** Absent for date-only and floating values. */
  instant?: Date
  /**
   * The zone the wall clock is anchored to: an IANA name, `'UTC'` for a `Z`
   * value, or undefined when floating or date-only. Recurrence must expand in
   * this zone, not the viewer's, or instances drift by an hour across DST.
   */
  zone?: string
}

/**
 * Parse `DTSTART` / `DTEND` / `RECURRENCE-ID` and friends.
 *
 * Four forms, all of which appear in the wild:
 * `VALUE=DATE` (`20260303`), UTC (`20260303T090000Z`), zoned
 * (`TZID=Europe/Oslo:20260303T090000`), and floating (no zone at all, which
 * means "whatever local time the viewer is in").
 */
export function parseICalDate(property: ICalProperty): ICalDateValue {
  const raw = property.value.trim()
  const dateOnly = property.params.VALUE === 'DATE' || /^\d{8}$/.test(raw)

  const year = Number(raw.slice(0, 4))
  const month = Number(raw.slice(4, 6))
  const day = Number(raw.slice(6, 8))

  if (dateOnly) {
    return { value: `${pad(year, 4)}-${pad(month)}-${pad(day)}`, dateOnly: true }
  }

  const hour = Number(raw.slice(9, 11))
  const minute = Number(raw.slice(11, 13))
  const second = Number(raw.slice(13, 15)) || 0

  if (raw.endsWith('Z')) {
    const instant = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    return { value: toLocalIso(instant), dateOnly: false, instant, zone: 'UTC' }
  }

  const tzid = property.params.TZID
  if (tzid) {
    try {
      const instant = wallTimeInZone(
        Date.UTC(year, month - 1, day, hour, minute, second),
        tzid,
      )
      return { value: toLocalIso(instant), dateOnly: false, instant, zone: tzid }
    } catch {
      // An unknown TZID must not lose the event; fall through to floating.
    }
  }

  // Floating: the wall clock is the answer, in whatever zone renders it.
  const instant = new Date(year, month - 1, day, hour, minute, second)
  return { value: toLocalIso(instant), dateOnly: false, instant }
}

/** Serialise a `Date` as a UTC `DATE-TIME`. */
export function formatICalDate(date: Date, options: { dateOnly?: boolean } = {}): string {
  if (options.dateOnly) {
    return `${pad(date.getFullYear(), 4)}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  }
  return (
    `${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

/** RFC 5545 §3.3.6 duration, e.g. `P1DT2H30M`, into milliseconds. */
export function parseDuration(value: string): number {
  const match =
    /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value.trim())
  if (!match) return 0
  const [, sign, weeks, days, hours, minutes, seconds] = match
  const total =
    (Number(weeks ?? 0) * 604800 +
      Number(days ?? 0) * 86400 +
      Number(hours ?? 0) * 3600 +
      Number(minutes ?? 0) * 60 +
      Number(seconds ?? 0)) *
    MS_PER_SECOND
  return sign === '-' ? -total : total
}

function makeEvent(properties: ICalProperty[]): ICalEvent {
  return {
    properties,
    get: (name) => properties.find((property) => property.name === name.toUpperCase()),
    all: (name) => properties.filter((property) => property.name === name.toUpperCase()),
  }
}

/**
 * Every `VEVENT` in an iCalendar stream, as raw property bags.
 *
 * Nested components other than `VEVENT` are skipped wholesale — a `VALARM`
 * inside an event carries its own `DTSTART`, which would otherwise be read as
 * the event's.
 */
export function parseICalendar(text: string): ICalEvent[] {
  const events: ICalEvent[] = []
  let current: ICalProperty[] | null = null
  let nestedDepth = 0

  for (const line of unfoldLines(text)) {
    const property = parseContentLine(line)
    if (!property) continue

    if (property.name === 'BEGIN') {
      const component = property.value.toUpperCase()
      if (component === 'VEVENT' && current === null) current = []
      else if (current !== null) nestedDepth++
      continue
    }

    if (property.name === 'END') {
      const component = property.value.toUpperCase()
      if (component === 'VEVENT' && current !== null && nestedDepth === 0) {
        events.push(makeEvent(current))
        current = null
      } else if (nestedDepth > 0) nestedDepth--
      continue
    }

    if (current !== null && nestedDepth === 0) current.push(property)
  }

  return events
}

const STATUS_MAP: Record<string, CalendarEventStatus> = {
  CONFIRMED: 'confirmed',
  TENTATIVE: 'tentative',
  CANCELLED: 'cancelled',
}

/**
 * Narrow a parsed `VEVENT` to a `CalendarEvent`.
 *
 * `DTEND` is taken as-is because both this type and RFC 5545 treat it as
 * exclusive. When absent, `DURATION` is applied; when both are absent the
 * spec says a date-only event lasts one day and a timed one is instantaneous.
 */
export function icalEventToCalendarEvent(
  event: ICalEvent,
  options: { source?: string } = {},
): CalendarEvent | null {
  const dtstart = event.get('DTSTART')
  if (!dtstart) return null

  const start = parseICalDate(dtstart)
  const dtend = event.get('DTEND')
  const duration = event.get('DURATION')

  let end: string
  if (dtend) {
    end = parseICalDate(dtend).value
  } else if (duration) {
    const base = start.instant ?? new Date(`${start.value}T00:00:00`)
    const finish = new Date(base.getTime() + parseDuration(duration.value))
    end = start.dateOnly
      ? `${finish.getFullYear()}-${pad(finish.getMonth() + 1)}-${pad(finish.getDate())}`
      : toLocalIso(finish)
  } else if (start.dateOnly) {
    const next = new Date(`${start.value}T00:00:00`)
    next.setDate(next.getDate() + 1)
    end = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`
  } else {
    end = start.value
  }

  const text = (name: string) => {
    const property = event.get(name)
    return property ? unescapeText(property.value) : undefined
  }

  const status = event.get('STATUS')?.value.toUpperCase()

  return {
    id: event.get('UID')?.value ?? `${start.value}-${text('SUMMARY') ?? 'untitled'}`,
    title: text('SUMMARY') ?? '(no title)',
    start: start.value,
    end,
    ...(start.dateOnly ? { allDay: true } : {}),
    ...(text('DESCRIPTION') ? { description: text('DESCRIPTION') } : {}),
    ...(text('LOCATION') ? { location: text('LOCATION') } : {}),
    ...(event.get('URL') ? { url: event.get('URL')!.value } : {}),
    ...(status && STATUS_MAP[status] ? { status: STATUS_MAP[status] } : {}),
    ...(options.source ? { source: options.source } : {}),
  }
}

/** Every `VEVENT` in the stream, narrowed. Unparseable events are dropped. */
export function parseCalendarEvents(
  text: string,
  options: { source?: string } = {},
): CalendarEvent[] {
  return parseICalendar(text)
    .map((event) => icalEventToCalendarEvent(event, options))
    .filter((event): event is CalendarEvent => event !== null)
}

/** Fold a content line to 75 octets, per RFC 5545 §3.1. */
function fold(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line

  const out: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    // Continuations carry a leading space, so their budget is one octet less.
    const limit = out.length === 0 ? 75 : 74
    if (bytes + size > limit) {
      out.push(current)
      current = ''
      bytes = 0
    }
    current += char
    bytes += size
  }
  out.push(current)
  return out.join('\r\n ')
}

/**
 * Serialise one event as a `VEVENT`.
 *
 * Timed values are written as UTC, which every server accepts and which avoids
 * emitting a `VTIMEZONE` block this module does not model.
 */
export function calendarEventToICal(event: CalendarEvent): string {
  const lines: string[] = ['BEGIN:VEVENT', `UID:${event.id}`]

  if (event.allDay) {
    const start = new Date(`${event.start.slice(0, 10)}T00:00:00`)
    const end = new Date(`${event.end.slice(0, 10)}T00:00:00`)
    lines.push(`DTSTART;VALUE=DATE:${formatICalDate(start, { dateOnly: true })}`)
    lines.push(`DTEND;VALUE=DATE:${formatICalDate(end, { dateOnly: true })}`)
  } else {
    lines.push(`DTSTART:${formatICalDate(new Date(event.start))}`)
    lines.push(`DTEND:${formatICalDate(new Date(event.end))}`)
  }

  lines.push(`SUMMARY:${escapeText(event.title)}`)
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`)
  if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`)
  if (event.url) lines.push(`URL:${event.url}`)
  if (event.status) lines.push(`STATUS:${event.status.toUpperCase()}`)
  lines.push('END:VEVENT')

  return lines.map(fold).join('\r\n')
}

/** Wrap events in a `VCALENDAR` ready to PUT to a server. */
export function toICalendar(
  events: readonly CalendarEvent[],
  options: { prodId?: string } = {},
): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${options.prodId ?? '-//tint//calendar//EN'}`,
    ...events.map(calendarEventToICal).flatMap((block) => block.split('\r\n')),
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
