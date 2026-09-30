import type { CalendarDay, CalendarEvent, CalendarWeekStart } from './contracts'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export function calendarWeekdayLabels(weekStart: CalendarWeekStart): string[] {
  return [...WEEKDAY_LABELS.slice(weekStart), ...WEEKDAY_LABELS.slice(0, weekStart)]
}

export function visibleDayEvents(day: CalendarDay, maxEventsPerDay: number): {
  shown: readonly CalendarEvent[]
  hidden: number
} {
  const shown = day.events.slice(0, maxEventsPerDay)
  return { shown, hidden: day.events.length - shown.length }
}

export function calendarMonthLabel(year: number, month: number, locale?: string): string {
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

export function calendarMonthOf(date: Date): { year: number; month: number } {
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}
