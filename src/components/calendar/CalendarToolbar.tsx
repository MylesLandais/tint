import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../button'
import { Icon } from '../icon'
import { cn } from '../../lib/utils'
import { nextCalendarMonth, previousCalendarMonth } from './contracts'

export type CalendarToolbarProps = {
  year: number
  /** 1-12, not the 0-based `Date` convention. */
  month: number
  onNavigate: (next: { year: number; month: number }) => void
  /**
   * What "Today" navigates to. Injected rather than read from the clock so the
   * toolbar stays deterministic in tests.
   */
  today?: Date
  /** BCP 47 tag for the month label. Defaults to the runtime locale. */
  locale?: string
  className?: string
}

/**
 * Month label with previous / next / today navigation.
 *
 * Controlled: it computes the target month and reports it, but never holds the
 * current one.
 */
export function CalendarToolbar({
  year,
  month,
  onNavigate,
  today,
  locale,
  className,
}: CalendarToolbarProps) {
  const label = new Date(year, month - 1, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })

  const goToday = () => {
    const now = today ?? new Date()
    onNavigate({ year: now.getFullYear(), month: now.getMonth() + 1 })
  }

  return (
    <div
      data-tint-calendar-toolbar=""
      className={cn('flex items-center justify-between gap-2', className)}
    >
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Previous month"
          onClick={() => onNavigate(previousCalendarMonth(year, month))}
        >
          <Icon icon={ChevronLeft} size="sm" />
        </Button>
        <h2 className="m-0 text-base font-semibold tracking-tight text-tint-ink">{label}</h2>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Next month"
          onClick={() => onNavigate(nextCalendarMonth(year, month))}
        >
          <Icon icon={ChevronRight} size="sm" />
        </Button>
      </div>

      <Button type="button" variant="secondary" size="sm" onClick={goToday}>
        Today
      </Button>
    </div>
  )
}
