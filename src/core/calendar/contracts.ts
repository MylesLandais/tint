/**
 * Host-owned calendar model and the pure month-grid projection, React-free.
 *
 * Field names follow RFC 5545 (iCalendar) semantics rather than any one
 * provider's JSON, so a CalDAV `VEVENT`, a Google event, or a hand-built
 * fixture all land in the same shape. The mapping is noted per field.
 *
 * Nothing here fetches, expands recurrences, or resolves time zones. Hosts hand
 * in events that are already single instances in a known zone — the same
 * division every other tint package draws between transport and presentation.
 */

/** Maps to `VEVENT` `UID`. */
export type CalendarEventId = string

/** `YYYY-MM-DD`, the key a day cell is addressed by. */
export type CalendarDateKey = string

/** Maps to `VEVENT` `STATUS`. */
export type CalendarEventStatus = 'confirmed' | 'tentative' | 'cancelled'

export type CalendarEvent = {
  id: CalendarEventId
  /** `SUMMARY`. */
  title: string
  /** `DTSTART`, ISO 8601. Date-only (`YYYY-MM-DD`) when `allDay`. */
  start: string
  /**
   * `DTEND`, ISO 8601. Per RFC 5545 this is **exclusive**: an all-day event on
   * the 3rd ends `2026-01-04`. `eventDateRange` converts to inclusive keys.
   */
  end: string
  /** `DTSTART;VALUE=DATE` — the event occupies whole days. */
  allDay?: boolean
  /** `DESCRIPTION`. */
  description?: string
  /** `LOCATION`. */
  location?: string
  /** `URL`. */
  url?: string
  /** `STATUS`. */
  status?: CalendarEventStatus
  /**
   * Which collection this came from — a CalDAV calendar href, a provider name,
   * a workflow state. Tint never interprets it; it is offered to the host for
   * theming and is the seam the demo's google/pending/accepted legend sits on.
   */
  source?: string
  /** Opaque host payload. The calendar chrome never inspects it. */
  payload?: unknown
}

export type CalendarDay = {
  date: CalendarDateKey
  /** Day of month, 1-31. */
  day: number
  /** False for the leading/trailing days that pad the grid to whole weeks. */
  inMonth: boolean
  isToday: boolean
  /** Single-day events only; multi-day ones are placed as spans on the week. */
  events: readonly CalendarEvent[]
}

/**
 * A multi-day event's placement on one week row: which columns it covers, which
 * horizontal lane it was packed into, and whether it is clipped by the week.
 */
export type CalendarSpan = {
  event: CalendarEvent
  /** 0-6, inclusive. */
  colStart: number
  /** 0-6, inclusive. */
  colEnd: number
  /** 0-based row within the week's span area. */
  lane: number
  continuesFromPrev: boolean
  continuesToNext: boolean
}

export type CalendarWeek = {
  days: readonly CalendarDay[]
  spans: readonly CalendarSpan[]
  /** Lanes needed by this week — the height the span area must reserve. */
  spanLaneCount: number
}

export type CalendarMonth = {
  year: number
  /** 1-12, not the 0-based `Date` convention. */
  month: number
  weeks: readonly CalendarWeek[]
}

/** 0 = Sunday, matching `Date.getDay()`. */
export type CalendarWeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6

const MS_PER_DAY = 86_400_000

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** `Date` -> `YYYY-MM-DD` in the *local* zone, never UTC. */
export function toDateKey(date: Date): CalendarDateKey {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** `YYYY-MM-DD` -> local midnight. */
export function fromDateKey(key: CalendarDateKey): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

/**
 * The inclusive local day range an event occupies.
 *
 * Two conversions happen here, both required by RFC 5545 and both easy to get
 * wrong. An all-day event's `DTEND` is exclusive, so it moves back one day. A
 * timed event ending exactly at midnight belongs to the previous day, not to
 * the one it touches for zero seconds — otherwise a 09:00-00:00 shift would
 * render as spanning two days.
 */
export function eventDateRange(event: CalendarEvent): {
  startKey: CalendarDateKey
  endKey: CalendarDateKey
} {
  if (event.allDay) {
    const startKey = event.start.slice(0, 10)
    const exclusive = fromDateKey(event.end.slice(0, 10))
    exclusive.setDate(exclusive.getDate() - 1)
    const endKey = toDateKey(exclusive)
    return { startKey, endKey: endKey < startKey ? startKey : endKey }
  }

  const start = new Date(event.start)
  const end = new Date(event.end)
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate())

  const endsAtMidnight =
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end.getMilliseconds() === 0
  if (endsAtMidnight && endDay.getTime() > startDay.getTime()) {
    endDay.setDate(endDay.getDate() - 1)
  }
  if (endDay < startDay) return { startKey: toDateKey(startDay), endKey: toDateKey(startDay) }

  return { startKey: toDateKey(startDay), endKey: toDateKey(endDay) }
}

/** Every day key from `startKey` to `endKey`, inclusive. */
export function enumerateDateKeys(
  startKey: CalendarDateKey,
  endKey: CalendarDateKey,
): CalendarDateKey[] {
  const keys: CalendarDateKey[] = []
  const cursor = fromDateKey(startKey)
  const last = fromDateKey(endKey)
  while (cursor <= last) {
    keys.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return keys
}

/** True when the event covers more than one local day. */
export function isMultiDay(event: CalendarEvent): boolean {
  const { startKey, endKey } = eventDateRange(event)
  return startKey !== endKey
}

/** Do the two events share at least one local day? */
export function eventsOverlap(a: CalendarEvent, b: CalendarEvent): boolean {
  const left = eventDateRange(a)
  const right = eventDateRange(b)
  return left.startKey <= right.endKey && right.startKey <= left.endKey
}

/**
 * Merge `candidates` into `primary`, dropping any that look like something
 * `primary` already has: same title (trimmed, case-insensitive) on overlapping
 * days. The demo used this to stop an email-derived suggestion from
 * double-rendering next to the real calendar event it was derived from.
 */
export function dedupeEvents(
  primary: readonly CalendarEvent[],
  candidates: readonly CalendarEvent[],
): CalendarEvent[] {
  const normalize = (title: string) => title.trim().toLowerCase()
  const merged = [...primary]
  for (const candidate of candidates) {
    const duplicate = primary.some(
      (existing) =>
        normalize(existing.title) === normalize(candidate.title) &&
        eventsOverlap(existing, candidate),
    )
    if (!duplicate) merged.push(candidate)
  }
  return merged
}

function rangesOverlap(
  a: { colStart: number; colEnd: number },
  b: { colStart: number; colEnd: number },
): boolean {
  return a.colStart <= b.colEnd && b.colStart <= a.colEnd
}

/**
 * Pack one week's multi-day events into horizontal lanes.
 *
 * Greedy and deterministic: longest events first (ties broken by start time),
 * each taking the lowest lane it fits in. Longest-first keeps the bars that
 * cross the whole week at the top, which is what makes the stack readable —
 * insertion order would let a one-day sliver claim lane 0 and push a week-long
 * bar underneath it.
 */
export function buildWeekSpans(
  weekDateKeys: readonly CalendarDateKey[],
  events: readonly CalendarEvent[],
): CalendarSpan[] {
  const spanLength = (event: CalendarEvent) => {
    const { startKey, endKey } = eventDateRange(event)
    return (fromDateKey(endKey).getTime() - fromDateKey(startKey).getTime()) / MS_PER_DAY
  }

  const multiDay = events.filter(isMultiDay).sort((a, b) => {
    const byLength = spanLength(b) - spanLength(a)
    if (byLength !== 0) return byLength
    return new Date(a.start).getTime() - new Date(b.start).getTime()
  })

  const laneOccupancy: { colStart: number; colEnd: number }[][] = []
  const spans: CalendarSpan[] = []

  for (const event of multiDay) {
    const { startKey, endKey } = eventDateRange(event)
    const covered = new Set(enumerateDateKeys(startKey, endKey))

    const cols: number[] = []
    weekDateKeys.forEach((key, index) => {
      if (covered.has(key)) cols.push(index)
    })
    if (cols.length === 0) continue

    const colStart = Math.min(...cols)
    const colEnd = Math.max(...cols)

    let lane = 0
    for (;;) {
      const occupants = (laneOccupancy[lane] ??= [])
      if (!occupants.some((slot) => rangesOverlap(slot, { colStart, colEnd }))) {
        occupants.push({ colStart, colEnd })
        break
      }
      lane++
    }

    spans.push({
      event,
      colStart,
      colEnd,
      lane,
      continuesFromPrev: weekDateKeys[colStart]! > startKey,
      continuesToNext: weekDateKeys[colEnd]! < endKey,
    })
  }

  return spans
}

/**
 * Project events onto a month grid padded to whole weeks.
 *
 * Single-day events land in `day.events`; multi-day ones become `week.spans`,
 * so a bar can be drawn continuously across columns instead of being repeated
 * in each cell it touches.
 *
 * `today` is injected rather than read from the clock so the projection stays
 * pure and testable.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  events: readonly CalendarEvent[],
  options: { weekStart?: CalendarWeekStart; today?: Date } = {},
): CalendarMonth {
  const weekStart = options.weekStart ?? 0
  const todayKey = toDateKey(options.today ?? new Date())

  const first = new Date(year, month - 1, 1)
  const leading = (first.getDay() - weekStart + 7) % 7
  const gridStart = new Date(year, month - 1, 1 - leading)

  const daysInMonth = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7

  const singleDayByKey = new Map<CalendarDateKey, CalendarEvent[]>()
  for (const event of events) {
    if (isMultiDay(event)) continue
    const key = eventDateRange(event).startKey
    const bucket = singleDayByKey.get(key)
    if (bucket) bucket.push(event)
    else singleDayByKey.set(key, [event])
  }

  const weeks: CalendarWeek[] = []
  for (let offset = 0; offset < totalCells; offset += 7) {
    const days: CalendarDay[] = []
    for (let column = 0; column < 7; column++) {
      const cursor = new Date(gridStart)
      cursor.setDate(cursor.getDate() + offset + column)
      const key = toDateKey(cursor)
      days.push({
        date: key,
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === month - 1 && cursor.getFullYear() === year,
        isToday: key === todayKey,
        events: singleDayByKey.get(key) ?? [],
      })
    }

    const spans = buildWeekSpans(
      days.map((day) => day.date),
      events,
    )
    weeks.push({
      days,
      spans,
      spanLaneCount: spans.reduce((max, span) => Math.max(max, span.lane + 1), 0),
    })
  }

  return { year, month, weeks }
}

/** The month before `{ year, month }`, 1-12. */
export function previousCalendarMonth(year: number, month: number): { year: number; month: number } {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
}

/** The month after `{ year, month }`, 1-12. */
export function nextCalendarMonth(year: number, month: number): { year: number; month: number } {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }
}
