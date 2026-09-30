<script lang="ts">
  import type { CalendarEvent } from '../core/calendar'
  import { CalendarMonthView, CalendarToolbar } from '../svelte/components/calendar'
  import DocPage from './svelte/DocPage.svelte'
  import type { ApiRow } from './svelte/types'

  const today = new Date(2026, 8, 17)
  const events: CalendarEvent[] = [
    { id: 'review', title: 'Design review', start: '2026-09-17T10:00:00', end: '2026-09-17T11:00:00', source: 'team' },
    { id: 'release', title: 'Release window', start: '2026-09-21', end: '2026-09-24', allDay: true, source: 'release' },
    { id: 'planning', title: 'Planning', start: '2026-09-24T13:00:00', end: '2026-09-24T14:00:00', status: 'tentative' },
  ]
  let year = $state(2026)
  let month = $state(9)
  let selectedDate = $state<string | null>('2026-09-17')
  let selectedEvent = $state('none')

  const api: ApiRow[] = [
    { prop: 'CalendarMonthView.year / month', type: 'number / 1–12', description: 'Host-selected month. Month uses calendar numbering, not Date’s zero-based month.' },
    { prop: 'events', type: 'readonly CalendarEvent[]', description: 'Already expanded event instances in the host’s chosen zone; all-day end dates are exclusive.' },
    { prop: 'selectedDate / onSelectDate', type: 'string | null / (date) => void', description: 'Controlled day selection using YYYY-MM-DD keys.' },
    { prop: 'onSelectEvent', type: '(event) => void', description: 'Intent emitted when a single or multi-day event is activated.' },
    { prop: 'renderEvent / renderSpan', type: 'Snippet<[CalendarEvent]> / Snippet<[CalendarSpan]>', description: 'Optional host-rendered event chip or span bar.' },
    { prop: 'CalendarToolbar.onNavigate', type: '({ year, month }) => void', description: 'Controlled previous, next, and today navigation.' },
  ]
  const usage = `import { CalendarMonthView, CalendarToolbar } from '@nebula/tint/calendar'

let year = $state(2026)
let month = $state(9)
let selectedDate = $state<string | null>(null)

<CalendarToolbar {year} {month}
  onNavigate={(next) => { year = next.year; month = next.month }} />
<CalendarMonthView {year} {month} {events} {selectedDate}
  onSelectDate={(date) => selectedDate = date}
  onSelectEvent={(event) => openEvent(event.id)} />`
</script>

<DocPage title="Calendar" description="A controlled month grid over framework-neutral event and recurrence models. The host supplies expanded instances and owns the selected month, day, and event action." importPath="@nebula/tint/calendar" {usage} {api} accessibility="The month uses grid, row, columnheader, and gridcell roles. One date is in the Tab order; arrow keys and Home/End move focus, while Enter and Space select. Event actions are separate buttons, selected dates expose aria-selected, today exposes aria-current, and focus has a visible outline.">
  <div class="calendar-demo">
    <CalendarToolbar {year} {month} {today} onNavigate={(next) => { year = next.year; month = next.month }} />
    <CalendarMonthView {year} {month} {events} {today} {selectedDate} onSelectDate={(date) => selectedDate = date} onSelectEvent={(event) => selectedEvent = event.title} label="Demo calendar" />
    <p aria-live="polite">Selected day: {selectedDate ?? 'none'} · Event: {selectedEvent}</p>
  </div>
</DocPage>

<style>
  .calendar-demo { display: grid; gap: 1rem; min-width: 0; }
  p { margin: 0; color: var(--tint-muted); font-size: .85rem; }
</style>
