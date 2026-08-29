import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'
import {
  buildMonthGrid,
  type CalendarDay,
  type CalendarEvent,
  type CalendarSpan,
  type CalendarWeekStart,
} from './contracts'

/** Sunday-first; rotated by `weekStart`. */
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

const LANE_HEIGHT_REM = 1.25

export type CalendarMonthViewProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onSelect' | 'children'
> & {
  year: number
  /** 1-12, not the 0-based `Date` convention. */
  month: number
  events: readonly CalendarEvent[]
  /** 0 = Sunday. Defaults to Sunday. */
  weekStart?: CalendarWeekStart
  /**
   * Injected so the grid is deterministic in tests and stories. Defaults to
   * the current date.
   */
  today?: Date
  /** Events beyond this per day collapse into a "+N more" affordance. */
  maxEventsPerDay?: number
  selectedDate?: string | null
  onSelectDate?: (date: string) => void
  onSelectEvent?: (event: CalendarEvent) => void
  /** Replaces the default chip for a single-day event. */
  renderEvent?: (event: CalendarEvent) => ReactNode
  /** Replaces the default bar for a multi-day span. */
  renderSpan?: (span: CalendarSpan) => ReactNode
  /** Accessible name for the grid. */
  label?: string
}

/**
 * A controlled month grid.
 *
 * Single-day events render inside their cell; multi-day events render as bars
 * across the week they fall in, packed into lanes by `buildWeekSpans`, so one
 * event reads as one continuous object rather than repeating in every cell it
 * touches. Each week reserves exactly the lane height it needs.
 *
 * The component owns no state and fetches nothing — `events` are whatever the
 * host has already resolved to single instances.
 */
export function CalendarMonthView({
  year,
  month,
  events,
  weekStart = 0,
  today,
  maxEventsPerDay = 3,
  selectedDate = null,
  onSelectDate,
  onSelectEvent,
  renderEvent,
  renderSpan,
  label,
  className,
  ...props
}: CalendarMonthViewProps) {
  const grid = buildMonthGrid(year, month, events, { weekStart, today })
  const weekdays = [...WEEKDAY_LABELS.slice(weekStart), ...WEEKDAY_LABELS.slice(0, weekStart)]

  return (
    <div
      data-tint-calendar-month=""
      className={cn('flex min-w-0 flex-col gap-1', className)}
      role="grid"
      aria-label={label ?? `${year}-${String(month).padStart(2, '0')}`}
      {...props}
    >
      <div role="row" className="grid grid-cols-7 gap-1">
        {weekdays.map((weekday) => (
          <div
            key={weekday}
            role="columnheader"
            className="px-1 py-1 text-center text-[0.6875rem] font-semibold tracking-wide text-tint-muted uppercase"
          >
            {weekday}
          </div>
        ))}
      </div>

      {grid.weeks.map((week) => (
        <div key={week.days[0]!.date} role="row" className="relative">
          <div className="grid grid-cols-7 gap-1">
            {week.days.map((day) => (
              <DayCell
                key={day.date}
                day={day}
                laneCount={week.spanLaneCount}
                selected={day.date === selectedDate}
                maxEvents={maxEventsPerDay}
                onSelectDate={onSelectDate}
                onSelectEvent={onSelectEvent}
                renderEvent={renderEvent}
              />
            ))}
          </div>

          {/*
            Spans sit in an overlay above the cells rather than inside them: a
            bar has to cross cell boundaries, which it cannot do from within a
            grid item. `pointer-events-none` keeps the day cells clickable
            everywhere the bars do not actually cover.
          */}
          {week.spans.length > 0 ? (
            <div
              className="pointer-events-none absolute inset-x-0 grid grid-cols-7 gap-1"
              style={{ top: '1.75rem' }}
              aria-hidden={false}
            >
              {week.spans.map((span) => (
                <div
                  key={span.event.id}
                  className="pointer-events-auto"
                  style={{
                    gridColumn: `${span.colStart + 1} / ${span.colEnd + 2}`,
                    gridRow: 1,
                    marginTop: `${span.lane * LANE_HEIGHT_REM}rem`,
                  }}
                >
                  {renderSpan ? (
                    renderSpan(span)
                  ) : (
                    <SpanBar span={span} onSelectEvent={onSelectEvent} />
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function DayCell({
  day,
  laneCount,
  selected,
  maxEvents,
  onSelectDate,
  onSelectEvent,
  renderEvent,
}: {
  day: CalendarDay
  laneCount: number
  selected: boolean
  maxEvents: number
  onSelectDate?: (date: string) => void
  onSelectEvent?: (event: CalendarEvent) => void
  renderEvent?: (event: CalendarEvent) => ReactNode
}) {
  const shown = day.events.slice(0, maxEvents)
  const hidden = day.events.length - shown.length
  const interactive = Boolean(onSelectDate)

  return (
    <div
      role="gridcell"
      data-tint-calendar-day=""
      data-date={day.date}
      aria-selected={selected}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onSelectDate!(day.date) : undefined}
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectDate!(day.date)
              }
            }
          : undefined
      }
      className={cn(
        'flex min-h-24 flex-col gap-1 rounded-lg border p-1 text-left',
        day.inMonth ? 'border-tint-border bg-tint-surface/60' : 'border-transparent opacity-50',
        selected && 'ring-2 ring-tint-accent',
        interactive && 'cursor-pointer hover:border-tint-accent',
      )}
    >
      <span
        className={cn(
          'px-1 font-mono text-xs tabular-nums',
          day.isToday
            ? 'w-fit rounded bg-tint-accent px-1.5 font-semibold text-tint-on-accent'
            : 'text-tint-muted',
        )}
      >
        {day.day}
      </span>

      {/* Reserve the span overlay's height so bars never cover the events. */}
      {laneCount > 0 ? (
        <div aria-hidden style={{ height: `${laneCount * LANE_HEIGHT_REM}rem` }} />
      ) : null}

      <div className="flex flex-col gap-0.5">
        {shown.map((event) =>
          renderEvent ? (
            <div key={event.id}>{renderEvent(event)}</div>
          ) : (
            <EventChip key={event.id} event={event} onSelectEvent={onSelectEvent} />
          ),
        )}
        {hidden > 0 ? (
          <span className="px-1 text-[0.6875rem] text-tint-muted">+{hidden} more</span>
        ) : null}
      </div>
    </div>
  )
}

function EventChip({
  event,
  onSelectEvent,
}: {
  event: CalendarEvent
  onSelectEvent?: (event: CalendarEvent) => void
}) {
  const content = (
    <>
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full bg-tint-accent"
        data-tint-calendar-dot=""
      />
      <span className="truncate">{event.title}</span>
    </>
  )

  const shared = {
    'data-tint-calendar-event': '',
    'data-source': event.source,
    'data-status': event.status,
    title: event.title,
    className: cn(
      'flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[0.6875rem] text-tint-ink',
      'bg-tint-panel hover:bg-tint-accent-soft',
      event.status === 'cancelled' && 'line-through opacity-60',
    ),
  }

  if (!onSelectEvent) return <span {...shared}>{content}</span>
  return (
    <button
      type="button"
      {...shared}
      onClick={(clickEvent) => {
        // The day cell is also clickable; selecting an event is the more
        // specific intent and must not also open the day.
        clickEvent.stopPropagation()
        onSelectEvent(event)
      }}
    >
      {content}
    </button>
  )
}

function SpanBar({
  span,
  onSelectEvent,
}: {
  span: CalendarSpan
  onSelectEvent?: (event: CalendarEvent) => void
}) {
  const shared = {
    'data-tint-calendar-span': '',
    'data-source': span.event.source,
    'data-continues-from-prev': span.continuesFromPrev ? '' : undefined,
    'data-continues-to-next': span.continuesToNext ? '' : undefined,
    title: span.event.title,
    className: cn(
      'flex h-5 w-full items-center overflow-hidden px-1.5 text-[0.6875rem] text-tint-on-accent',
      'bg-tint-accent',
      // A clipped edge stays square so the bar reads as continuing off-week.
      span.continuesFromPrev ? 'rounded-l-none' : 'rounded-l',
      span.continuesToNext ? 'rounded-r-none' : 'rounded-r',
      span.event.status === 'cancelled' && 'line-through opacity-60',
    ),
  }

  // Only the leading segment is labelled; repeating the title on every week
  // would read as several events rather than one continuing bar.
  const content = span.continuesFromPrev ? null : (
    <span className="truncate">{span.event.title}</span>
  )

  if (!onSelectEvent) return <div {...shared}>{content}</div>
  return (
    <button
      type="button"
      {...shared}
      onClick={(clickEvent) => {
        clickEvent.stopPropagation()
        onSelectEvent(span.event)
      }}
    >
      {content}
    </button>
  )
}
