<script lang="ts">
  import type { CalendarEvent, CalendarSpan } from '../../../core/calendar'
  import CalendarMonthView from './CalendarMonthView.svelte'

  const events: CalendarEvent[] = [
    { id: 'standup', title: 'Standup', start: '2026-03-10T09:00:00', end: '2026-03-10T09:15:00' },
    { id: 'offsite', title: 'Offsite', allDay: true, start: '2026-03-03', end: '2026-03-06' },
  ]
</script>

{#snippet renderEvent(event: CalendarEvent)}<em>custom {event.title}</em>{/snippet}
{#snippet renderSpan(span: CalendarSpan)}<em>bar {span.event.title}</em>{/snippet}

<CalendarMonthView year={2026} month={3} {events} today={new Date(2026, 2, 15)} {renderEvent} {renderSpan} />
