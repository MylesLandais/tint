/**
 * RFC 5545 recurrence: `RRULE` expansion, plus `EXDATE`, `RDATE`, and
 * `RECURRENCE-ID` overrides.
 *
 * This is the part the EntryTriage demo never needed — it asked Google for
 * `singleEvents: true` and let the server expand. CalDAV offers no such
 * guarantee, so a client either does this or shows recurring events once.
 *
 * Expansion is always bounded by an explicit window. An unbounded rule (no
 * `COUNT`, no `UNTIL`) is legal and infinite; a window is what makes it safe.
 *
 * Supported: `FREQ` (DAILY/WEEKLY/MONTHLY/YEARLY), `INTERVAL`, `COUNT`,
 * `UNTIL`, `BYDAY` (with ordinals like `3MO` / `-1FR`), `BYMONTHDAY` (negative
 * allowed), `BYMONTH`, `BYSETPOS`, and `WKST`.
 *
 * Not supported, and reported rather than silently ignored: `BYYEARDAY`,
 * `BYWEEKNO`, `BYHOUR`, `BYMINUTE`, `BYSECOND`. `SECONDLY`/`MINUTELY`/`HOURLY`
 * frequencies are also unhandled — they do not occur in calendar UIs and
 * expanding them over a month is a denial-of-service shape, not a feature.
 */

import type { CalendarEvent } from './contracts'
import {
  fromZonedWallClock,
  icalEventToCalendarEvent,
  parseICalDate,
  toZonedWallClock,
  type ICalEvent,
} from './ical'

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

/** `SU`=0 … `SA`=6, matching `Date.getDay()`. */
const WEEKDAY_NUMBERS: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
}

export type ByDay = {
  weekday: number
  /** `3` in `3MO`, `-1` in `-1FR`; absent means every matching weekday. */
  ordinal?: number
}

export type RecurrenceRule = {
  freq: RecurrenceFrequency
  interval: number
  count?: number
  until?: Date
  byDay?: readonly ByDay[]
  byMonthDay?: readonly number[]
  byMonth?: readonly number[]
  bySetPos?: readonly number[]
  weekStart: number
  /** Parts present in the rule that this implementation does not apply. */
  unsupported: readonly string[]
}

const UNSUPPORTED_PARTS = ['BYYEARDAY', 'BYWEEKNO', 'BYHOUR', 'BYMINUTE', 'BYSECOND']

/** Parse an `RRULE` property value. Returns null if `FREQ` is missing or unhandled. */
export function parseRecurrenceRule(value: string): RecurrenceRule | null {
  const parts: Record<string, string> = {}
  for (const chunk of value.split(';')) {
    const equals = chunk.indexOf('=')
    if (equals === -1) continue
    parts[chunk.slice(0, equals).toUpperCase()] = chunk.slice(equals + 1)
  }

  const freq = parts.FREQ?.toUpperCase()
  if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY' && freq !== 'YEARLY') {
    return null
  }

  const numbers = (raw: string | undefined) =>
    raw
      ?.split(',')
      .map((entry) => Number(entry.trim()))
      .filter((entry) => Number.isFinite(entry))

  const byDay = parts.BYDAY?.split(',')
    .map((entry) => {
      const match = /^([+-]?\d+)?(SU|MO|TU|WE|TH|FR|SA)$/.exec(entry.trim().toUpperCase())
      if (!match) return null
      return {
        weekday: WEEKDAY_NUMBERS[match[2]!]!,
        ...(match[1] ? { ordinal: Number(match[1]) } : {}),
      }
    })
    .filter((entry): entry is ByDay => entry !== null)

  let until: Date | undefined
  if (parts.UNTIL) {
    const parsed = parseICalDate({ name: 'UNTIL', params: {}, value: parts.UNTIL })
    until = parsed.instant ?? new Date(`${parsed.value}T23:59:59`)
  }

  return {
    freq,
    interval: Math.max(1, Number(parts.INTERVAL ?? 1) || 1),
    ...(parts.COUNT ? { count: Number(parts.COUNT) } : {}),
    ...(until ? { until } : {}),
    ...(byDay && byDay.length > 0 ? { byDay } : {}),
    ...(numbers(parts.BYMONTHDAY) ? { byMonthDay: numbers(parts.BYMONTHDAY) } : {}),
    ...(numbers(parts.BYMONTH) ? { byMonth: numbers(parts.BYMONTH) } : {}),
    ...(numbers(parts.BYSETPOS) ? { bySetPos: numbers(parts.BYSETPOS) } : {}),
    weekStart: WEEKDAY_NUMBERS[parts.WKST?.toUpperCase() ?? 'MO'] ?? 1,
    unsupported: UNSUPPORTED_PARTS.filter((part) => part in parts),
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  // Pin to the 1st before shifting: adding a month to the 31st would otherwise
  // skip a month entirely by overflowing into the one after.
  const day = next.getDate()
  next.setDate(1)
  next.setMonth(next.getMonth() + months)
  const daysInTarget = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(day, daysInTarget))
  return next
}

/** Apply the seed's clock to a candidate day. */
function withTimeOf(seed: Date, day: Date): Date {
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    seed.getHours(),
    seed.getMinutes(),
    seed.getSeconds(),
    seed.getMilliseconds(),
  )
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

/** Candidate days within one period, before BYSETPOS narrowing. */
function expandPeriod(rule: RecurrenceRule, periodStart: Date): Date[] {
  const { freq, byDay, byMonthDay, byMonth } = rule

  if (freq === 'DAILY') {
    const day = startOfDay(periodStart)
    if (byMonth && !byMonth.includes(day.getMonth() + 1)) return []
    if (byDay && !byDay.some((entry) => entry.weekday === day.getDay())) return []
    if (byMonthDay && !matchesMonthDay(day, byMonthDay)) return []
    return [day]
  }

  if (freq === 'WEEKLY') {
    const weekStartDay = startOfDay(
      addDays(periodStart, -((periodStart.getDay() - rule.weekStart + 7) % 7)),
    )
    const days = byDay
      ? byDay.map((entry) =>
          addDays(weekStartDay, (entry.weekday - rule.weekStart + 7) % 7),
        )
      : [startOfDay(periodStart)]
    return days
      .filter((day) => !byMonth || byMonth.includes(day.getMonth() + 1))
      .sort((a, b) => a.getTime() - b.getTime())
  }

  // MONTHLY and YEARLY both enumerate whole months; YEARLY just iterates the
  // months BYMONTH selects (or the seed's month) inside the year.
  const months: { year: number; month: number }[] =
    freq === 'MONTHLY'
      ? [{ year: periodStart.getFullYear(), month: periodStart.getMonth() }]
      : (byMonth ?? [periodStart.getMonth() + 1]).map((month) => ({
          year: periodStart.getFullYear(),
          month: month - 1,
        }))

  const days: Date[] = []
  for (const { year, month } of months) {
    if (freq === 'MONTHLY' && byMonth && !byMonth.includes(month + 1)) continue
    const total = daysInMonth(year, month)

    if (byDay) {
      for (const entry of byDay) {
        const matching: Date[] = []
        for (let day = 1; day <= total; day++) {
          const candidate = new Date(year, month, day)
          if (candidate.getDay() === entry.weekday) matching.push(candidate)
        }
        if (entry.ordinal === undefined) {
          days.push(...matching)
        } else {
          const index = entry.ordinal > 0 ? entry.ordinal - 1 : matching.length + entry.ordinal
          const picked = matching[index]
          if (picked) days.push(picked)
        }
      }
    } else if (byMonthDay) {
      for (const monthDay of byMonthDay) {
        const day = monthDay > 0 ? monthDay : total + monthDay + 1
        if (day >= 1 && day <= total) days.push(new Date(year, month, day))
      }
    } else {
      const day = Math.min(periodStart.getDate(), total)
      days.push(new Date(year, month, day))
    }
  }

  // BYDAY and BYMONTHDAY together intersect rather than union.
  const filtered = byDay && byMonthDay ? days.filter((day) => matchesMonthDay(day, byMonthDay)) : days

  const unique = new Map(filtered.map((day) => [day.getTime(), day]))
  return [...unique.values()].sort((a, b) => a.getTime() - b.getTime())
}

function matchesMonthDay(day: Date, byMonthDay: readonly number[]): boolean {
  const total = daysInMonth(day.getFullYear(), day.getMonth())
  return byMonthDay.some((entry) => (entry > 0 ? entry : total + entry + 1) === day.getDate())
}

/** Pick the BYSETPOS-th entries out of a period's candidates, 1-based, negatives from the end. */
function applySetPos(days: Date[], bySetPos: readonly number[]): Date[] {
  const picked: Date[] = []
  for (const position of bySetPos) {
    const index = position > 0 ? position - 1 : days.length + position
    const day = days[index]
    if (day) picked.push(day)
  }
  return picked.sort((a, b) => a.getTime() - b.getTime())
}

export type RecurrenceWindow = { from: Date; to: Date }

/**
 * Occurrence start times for a rule seeded at `seed`, clipped to `window`.
 *
 * The iteration is bounded three ways — by `window.to`, by `COUNT`/`UNTIL`, and
 * by a hard cap on periods examined — because an unbounded rule with a narrow
 * `BYSETPOS` can otherwise spin for a long time producing nothing.
 */
export function expandRecurrence(
  seed: Date,
  rule: RecurrenceRule,
  window: RecurrenceWindow,
  options: { maxOccurrences?: number } = {},
): Date[] {
  const maxOccurrences = options.maxOccurrences ?? 1000
  const occurrences: Date[] = []
  let emitted = 0
  let period = startOfDay(seed)
  let guard = 0
  const GUARD_LIMIT = 5000

  const advance = (from: Date): Date => {
    if (rule.freq === 'DAILY') return addDays(from, rule.interval)
    if (rule.freq === 'WEEKLY') return addDays(from, 7 * rule.interval)
    if (rule.freq === 'MONTHLY') return addMonths(from, rule.interval)
    return addMonths(from, 12 * rule.interval)
  }

  while (guard++ < GUARD_LIMIT) {
    if (period.getTime() > window.to.getTime() + 86400000) break
    if (rule.count !== undefined && emitted >= rule.count) break

    const candidates = expandPeriod(rule, period)
    const selected = rule.bySetPos ? applySetPos(candidates, rule.bySetPos) : candidates

    for (const day of selected) {
      const occurrence = withTimeOf(seed, day)
      // Occurrences before the seed are not occurrences; COUNT and UNTIL are
      // measured from the seed forward.
      if (occurrence.getTime() < seed.getTime()) continue
      if (rule.until && occurrence.getTime() > rule.until.getTime()) return occurrences
      if (rule.count !== undefined && emitted >= rule.count) return occurrences
      emitted++
      if (occurrence >= window.from && occurrence <= window.to) occurrences.push(occurrence)
      if (occurrences.length >= maxOccurrences) return occurrences
    }

    period = advance(period)
  }

  return occurrences
}

function localKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`
}

/**
 * Expand one parsed `VEVENT` into the concrete instances inside `window`.
 *
 * Handles the full recurrence set, not just `RRULE`: `RDATE` adds dates,
 * `EXDATE` removes them, and a sibling `VEVENT` carrying `RECURRENCE-ID`
 * replaces the instance at that time. Overrides are matched to the minute,
 * since that is the resolution a `RECURRENCE-ID` addresses an instance by.
 *
 * A non-recurring event yields itself when it intersects the window.
 */
export function expandICalEvent(
  event: ICalEvent,
  base: CalendarEvent,
  window: RecurrenceWindow,
  options: { overrides?: readonly { recurrenceId: Date; event: CalendarEvent }[] } = {},
): CalendarEvent[] {
  const rruleProperty = event.get('RRULE')
  const durationMs = new Date(base.end).getTime() - new Date(base.start).getTime()

  /*
   * Recurrence is wall-clock arithmetic in the event's *own* zone, not the
   * viewer's (RFC 5545 §3.3.10). A 09:00Z weekly meeting stays at 09:00Z across
   * a DST boundary even though its local rendering shifts by an hour; expanding
   * in local time instead would move every instance after the transition, and
   * an EXDATE or RECURRENCE-ID naming the true instant would stop matching.
   *
   * So the whole expansion runs in a proxy space whose local fields are the
   * anchor zone's wall clock, and each result is mapped back at the end. A
   * floating or date-only event has no anchor and is already in that space.
   */
  const zone = event.get('DTSTART') ? parseICalDate(event.get('DTSTART')!).zone : undefined
  const intoProxy = (instant: Date) => (zone ? toZonedWallClock(instant, zone) : instant)
  const outOfProxy = (proxy: Date) => (zone ? fromZonedWallClock(proxy, zone) : proxy)

  const seed = intoProxy(new Date(base.start))

  const overrideByKey = new Map(
    (options.overrides ?? []).map((entry) => [localKey(intoProxy(entry.recurrenceId)), entry.event]),
  )

  const excluded = new Set(
    event
      .all('EXDATE')
      .flatMap((property) =>
        property.value.split(',').map((value) => {
          const parsed = parseICalDate({ ...property, value })
          return localKey(intoProxy(parsed.instant ?? new Date(`${parsed.value}T00:00:00`)))
        }),
      ),
  )

  const starts: Date[] = []
  if (rruleProperty) {
    const rule = parseRecurrenceRule(rruleProperty.value)
    if (rule) {
      starts.push(
        ...expandRecurrence(seed, rule, {
          from: intoProxy(window.from),
          to: intoProxy(window.to),
        }),
      )
    } else if (outOfProxy(seed) >= window.from && outOfProxy(seed) <= window.to) starts.push(seed)
  } else if (outOfProxy(seed) <= window.to && new Date(base.end) >= window.from) {
    starts.push(seed)
  }

  for (const property of event.all('RDATE')) {
    for (const value of property.value.split(',')) {
      const parsed = parseICalDate({ ...property, value })
      const date = intoProxy(parsed.instant ?? new Date(`${parsed.value}T00:00:00`))
      if (outOfProxy(date) >= window.from && outOfProxy(date) <= window.to) starts.push(date)
    }
  }

  const seen = new Set<string>()
  const instances: CalendarEvent[] = []
  for (const start of starts.sort((a, b) => a.getTime() - b.getTime())) {
    const key = localKey(start)
    if (excluded.has(key) || seen.has(key)) continue
    seen.add(key)

    const override = overrideByKey.get(key)
    if (override) {
      instances.push(override)
      continue
    }

    const actualStart = outOfProxy(start)
    const end = new Date(actualStart.getTime() + durationMs)
    instances.push({
      ...base,
      // A recurring event's UID is shared by every instance, so the id must be
      // qualified or React keys and selection collide across occurrences.
      id: rruleProperty ? `${base.id}::${key}` : base.id,
      start: base.allDay ? key.slice(0, 10) : formatLocal(actualStart),
      end: base.allDay ? addDayKey(end) : formatLocal(end),
    })
  }

  return instances
}

function formatLocal(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

function addDayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Parse a stream and expand everything in it to concrete instances.
 *
 * `RECURRENCE-ID` events are pulled out first and applied as overrides to the
 * master they belong to, rather than being emitted as separate events — which
 * is what makes "the 3rd Tuesday moved to Wednesday" render once, in the right
 * place, instead of twice.
 */
export function expandCalendarEvents(
  events: readonly ICalEvent[],
  window: RecurrenceWindow,
  options: { source?: string } = {},
): CalendarEvent[] {
  const masters: ICalEvent[] = []
  const overridesByUid = new Map<string, { recurrenceId: Date; event: CalendarEvent }[]>()

  for (const event of events) {
    const recurrenceId = event.get('RECURRENCE-ID')
    const uid = event.get('UID')?.value
    const converted = icalEventToCalendarEvent(event, options)
    if (!converted) continue

    if (recurrenceId && uid) {
      const parsed = parseICalDate(recurrenceId)
      const at = parsed.instant ?? new Date(`${parsed.value}T00:00:00`)
      const bucket = overridesByUid.get(uid) ?? []
      bucket.push({ recurrenceId: at, event: converted })
      overridesByUid.set(uid, bucket)
    } else {
      masters.push(event)
    }
  }

  return masters.flatMap((event) => {
    const base = icalEventToCalendarEvent(event, options)
    if (!base) return []
    const uid = event.get('UID')?.value
    return expandICalEvent(event, base, window, {
      overrides: uid ? (overridesByUid.get(uid) ?? []) : [],
    })
  })
}
