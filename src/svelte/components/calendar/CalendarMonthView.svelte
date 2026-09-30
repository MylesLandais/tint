<script lang="ts">
  import { buildMonthGrid, calendarWeekdayLabels, visibleDayEvents } from '../../../core/calendar'
  import type { CalendarEvent, CalendarSpan } from '../../../core/calendar'
  import type { CalendarMonthViewProps } from './types'

  const LANE_HEIGHT_REM = 1.25

  let {
    year, month, events, weekStart = 0, today, maxEventsPerDay = 3,
    selectedDate = null, onSelectDate, onSelectEvent, renderEvent, renderSpan,
    label, class: className, ...rest
  }: CalendarMonthViewProps = $props()

  let grid = $derived(buildMonthGrid(year, month, events, { weekStart, today }))
  let weekdays = $derived(calendarWeekdayLabels(weekStart))
  let dates = $derived(grid.weeks.flatMap((week) => week.days.map((day) => day.date)))
  let focusedDate = $state<string | null>(null)
  let tabbableDate = $derived(
    focusedDate && dates.includes(focusedDate) ? focusedDate
      : selectedDate && dates.includes(selectedDate) ? selectedDate
        : grid.weeks.flatMap((week) => week.days).find((day) => day.isToday)?.date ?? dates[0],
  )
  let gridRoot = $state<HTMLDivElement>()

  function selectDateFromKey(event: KeyboardEvent, date: string) {
    if (!onSelectDate || event.target !== event.currentTarget) return
    const index = dates.indexOf(date)
    const offset = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1
      : event.key === 'ArrowUp' ? -7 : event.key === 'ArrowDown' ? 7 : 0
    const nextIndex = event.key === 'Home' ? index - index % 7
      : event.key === 'End' ? index - index % 7 + 6 : index + offset
    if (index >= 0 && (offset || event.key === 'Home' || event.key === 'End')) {
      event.preventDefault()
      const nextDate = dates[Math.max(0, Math.min(dates.length - 1, nextIndex))]
      gridRoot?.querySelector<HTMLElement>(`[data-tint-calendar-day][data-date="${nextDate}"]`)?.focus()
      return
    }
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onSelectDate(date)
  }

  function selectEvent(click: MouseEvent, event: CalendarEvent) {
    click.stopPropagation()
    onSelectEvent?.(event)
  }
</script>

{#snippet eventChip(event: CalendarEvent)}
  {#if onSelectEvent}
    <button
      type="button" class="event-chip" class:cancelled={event.status === 'cancelled'}
      data-tint-calendar-event="" data-source={event.source} data-status={event.status}
      title={event.title} onclick={(click) => selectEvent(click, event)}
    ><span class="event-dot" aria-hidden="true" data-tint-calendar-dot=""></span><span class="event-title">{event.title}</span></button>
  {:else}
    <span
      class="event-chip" class:cancelled={event.status === 'cancelled'}
      data-tint-calendar-event="" data-source={event.source} data-status={event.status}
      title={event.title}
    ><span class="event-dot" aria-hidden="true" data-tint-calendar-dot=""></span><span class="event-title">{event.title}</span></span>
  {/if}
{/snippet}

{#snippet spanBar(span: CalendarSpan)}
  {#if onSelectEvent}
    <button
      type="button" class="span-bar" class:cancelled={span.event.status === 'cancelled'}
      class:continues-from-prev={span.continuesFromPrev} class:continues-to-next={span.continuesToNext}
      data-tint-calendar-span="" data-source={span.event.source}
      data-continues-from-prev={span.continuesFromPrev ? '' : undefined}
      data-continues-to-next={span.continuesToNext ? '' : undefined}
      title={span.event.title}
      aria-label={span.continuesFromPrev ? `${span.event.title} (continued)` : span.event.title}
      onclick={(click) => selectEvent(click, span.event)}
    >{#if !span.continuesFromPrev}<span class="span-title">{span.event.title}</span>{/if}</button>
  {:else}
    <div
      class="span-bar" class:cancelled={span.event.status === 'cancelled'}
      class:continues-from-prev={span.continuesFromPrev} class:continues-to-next={span.continuesToNext}
      data-tint-calendar-span="" data-source={span.event.source}
      data-continues-from-prev={span.continuesFromPrev ? '' : undefined}
      data-continues-to-next={span.continuesToNext ? '' : undefined}
      title={span.event.title}
    >{#if !span.continuesFromPrev}<span class="span-title">{span.event.title}</span>{/if}</div>
  {/if}
{/snippet}

<div
  {...rest}
  bind:this={gridRoot}
  role="grid"
  data-tint-calendar-month=""
  aria-label={label ?? `${year}-${String(month).padStart(2, '0')}`}
  class={['calendar-month', className].filter(Boolean).join(' ')}
>
  <div role="row" class="weekday-row">
    {#each weekdays as weekday (weekday)}<div role="columnheader">{weekday}</div>{/each}
  </div>

  {#each grid.weeks as week, weekIndex (week.days[0]?.date ?? weekIndex)}
    <div role="row" class="week-row">
      <div class="day-grid" role="presentation">
        {#each week.days as day (day.date)}
          {@const eventWindow = visibleDayEvents(day, maxEventsPerDay)}
          <div
            role="gridcell" data-tint-calendar-day="" data-date={day.date}
            aria-label={day.date} aria-selected={day.date === selectedDate}
            aria-current={day.isToday ? 'date' : undefined}
            tabindex={onSelectDate ? (day.date === tabbableDate ? 0 : -1) : undefined}
            class="day-cell" class:outside={!day.inMonth}
            class:selected={day.date === selectedDate} class:interactive={Boolean(onSelectDate)}
            onclick={() => onSelectDate?.(day.date)}
            onkeydown={(event) => selectDateFromKey(event, day.date)}
            onfocus={() => { focusedDate = day.date }}
          >
            <span class="day-number" class:today={day.isToday}>{day.day}</span>
            {#if week.spanLaneCount > 0}
              <div aria-hidden="true" style:height={`${week.spanLaneCount * LANE_HEIGHT_REM}rem`}></div>
            {/if}
            <div class="day-events">
              {#each eventWindow.shown as event (event.id)}
                {#if renderEvent}<div>{@render renderEvent(event)}</div>{:else}{@render eventChip(event)}{/if}
              {/each}
              {#if eventWindow.hidden > 0}<span class="more-events">+{eventWindow.hidden} more</span>{/if}
            </div>
          </div>
        {/each}
      </div>
      {#if week.spans.length > 0}
        <div class="span-overlay" style:top="1.75rem">
          {#each week.spans as span (span.event.id)}
            <div class="span-slot" style:grid-column={`${span.colStart + 1} / ${span.colEnd + 2}`} style:grid-row="1" style:margin-top={`${span.lane * LANE_HEIGHT_REM}rem`}>
              {#if renderSpan}{@render renderSpan(span)}{:else}{@render spanBar(span)}{/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/each}
</div>

<style>
  .calendar-month { container-type: inline-size; display: flex; min-width: 0; flex-direction: column; gap: var(--tint-space-1); }
  .weekday-row, .day-grid, .span-overlay { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: var(--tint-space-1); }
  .weekday-row [role='columnheader'] { padding: var(--tint-space-1); color: var(--tint-muted); font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.025em; text-align: center; text-transform: uppercase; }
  .week-row { position: relative; min-width: 0; }
  .day-cell { display: flex; min-width: 0; min-height: 6rem; flex-direction: column; gap: var(--tint-space-1); border: 1px solid var(--tint-border); border-radius: var(--tint-radius-md); background: var(--tint-surface); padding: var(--tint-space-1); text-align: left; }
  .day-cell.outside { border-color: transparent; opacity: 0.5; }
  .day-cell.selected { outline: 2px solid var(--tint-accent); outline-offset: -2px; }
  .day-cell.interactive { cursor: pointer; }
  .day-cell.interactive:hover { border-color: var(--tint-accent); }
  .day-cell:focus-visible, .event-chip:focus-visible, .span-bar:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .day-number { align-self: flex-start; padding: 0 var(--tint-space-1); color: var(--tint-muted); font-family: ui-monospace, monospace; font-size: var(--tint-font-size-xs); font-variant-numeric: tabular-nums; }
  .day-number.today { border-radius: var(--tint-radius-sm); background: var(--tint-accent); color: var(--tint-on-accent); font-weight: 600; }
  .day-events { display: flex; min-width: 0; flex-direction: column; gap: 0.125rem; }
  .event-chip { display: flex; width: 100%; min-width: 0; align-items: center; gap: var(--tint-space-1); border: 0; border-radius: var(--tint-radius-sm); background: var(--tint-panel); padding: 0.125rem var(--tint-space-1); color: var(--tint-ink); cursor: default; font: inherit; font-size: 0.6875rem; text-align: left; }
  button.event-chip { cursor: pointer; }
  .event-chip:hover { background: var(--tint-accent-soft); }
  .event-chip.cancelled, .span-bar.cancelled { opacity: 0.6; text-decoration: line-through; }
  .event-dot { width: 0.375rem; height: 0.375rem; flex: none; border-radius: 50%; background: var(--tint-accent); }
  .event-title, .span-title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .more-events { padding: 0 var(--tint-space-1); color: var(--tint-muted); font-size: 0.6875rem; }
  .span-overlay { pointer-events: none; position: absolute; right: 0; left: 0; }
  .span-slot { pointer-events: auto; min-width: 0; }
  .span-bar { display: flex; width: 100%; height: 1.25rem; align-items: center; overflow: hidden; border: 0; border-radius: var(--tint-radius-sm); background: var(--tint-accent); padding: 0 var(--tint-space-1); color: var(--tint-on-accent); cursor: default; font: inherit; font-size: 0.6875rem; text-align: left; }
  button.span-bar { cursor: pointer; }
  .span-bar.continues-from-prev { border-top-left-radius: 0; border-bottom-left-radius: 0; }
  .span-bar.continues-to-next { border-top-right-radius: 0; border-bottom-right-radius: 0; }
  @container (max-width: 540px) {
    .weekday-row, .day-grid, .span-overlay { gap: 0.125rem; }
    .day-cell { min-height: 4.5rem; padding: 0.125rem; }
    .event-chip { justify-content: center; padding: 0.125rem; }
    .event-title { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
    .more-events { font-size: 0.625rem; }
  }
</style>
