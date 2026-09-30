<script lang="ts">
  import { calendarMonthLabel, calendarMonthOf, nextCalendarMonth, previousCalendarMonth } from '../../../core/calendar'
  import Icon from '../icon/Icon.svelte'
  import { GLYPHS } from '../icon/glyphs'
  import type { CalendarToolbarProps } from './types'

  let { year, month, onNavigate, today, locale, class: className }: CalendarToolbarProps = $props()
  let label = $derived(calendarMonthLabel(year, month, locale))

  function goToday() {
    onNavigate(calendarMonthOf(today ?? new Date()))
  }
</script>

<div data-tint-calendar-toolbar="" class={['calendar-toolbar', className].filter(Boolean).join(' ')}>
  <div class="month-controls">
    <button type="button" aria-label="Previous month" onclick={() => onNavigate(previousCalendarMonth(year, month))}>
      <span class="previous-icon"><Icon icon={GLYPHS.chevronRight} size="sm" /></span>
    </button>
    <h2>{label}</h2>
    <button type="button" aria-label="Next month" onclick={() => onNavigate(nextCalendarMonth(year, month))}>
      <Icon icon={GLYPHS.chevronRight} size="sm" />
    </button>
  </div>
  <button type="button" class="today-button" onclick={goToday}>Today</button>
</div>

<style>
  .calendar-toolbar { container-type: inline-size; display: flex; min-width: 0; align-items: center; justify-content: space-between; gap: var(--tint-space-2); }
  .month-controls { display: flex; min-width: 0; align-items: center; gap: var(--tint-space-2); }
  h2 { min-width: 0; margin: 0; overflow: hidden; color: var(--tint-ink); font-size: var(--tint-font-size-md); font-weight: 600; letter-spacing: -0.025em; text-overflow: ellipsis; white-space: nowrap; }
  button { display: inline-flex; min-width: 2.25rem; min-height: 2.25rem; flex: none; align-items: center; justify-content: center; border: 1px solid var(--tint-border); border-radius: var(--tint-radius-sm); background: var(--tint-panel); padding: 0 var(--tint-space-2); color: var(--tint-ink); cursor: pointer; font: inherit; font-size: var(--tint-font-size-sm); }
  button:hover { background: var(--tint-accent-soft); }
  button:focus-visible { outline: var(--tint-focus-width) solid var(--tint-focus); outline-offset: var(--tint-focus-offset); }
  .previous-icon { display: inline-flex; transform: rotate(180deg); }
  @container (max-width: 360px) { .month-controls { gap: var(--tint-space-1); } h2 { font-size: var(--tint-font-size-sm); } .today-button { padding: 0 var(--tint-space-1); } }
</style>
