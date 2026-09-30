import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { CalendarEvent, CalendarSpan, CalendarWeekStart } from '../../../core/calendar'

export type CalendarMonthViewProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  year: number
  /** 1-12, not the zero-based Date convention. */
  month: number
  events: readonly CalendarEvent[]
  weekStart?: CalendarWeekStart
  today?: Date
  maxEventsPerDay?: number
  selectedDate?: string | null
  onSelectDate?: (date: string) => void
  onSelectEvent?: (event: CalendarEvent) => void
  /** Replaces the default single-day event chip. */
  renderEvent?: Snippet<[event: CalendarEvent]>
  /** Replaces the default multi-day bar. */
  renderSpan?: Snippet<[span: CalendarSpan]>
  label?: string
}

export type CalendarToolbarProps = {
  year: number
  month: number
  onNavigate: (next: { year: number; month: number }) => void
  today?: Date
  locale?: string
  class?: string
}
