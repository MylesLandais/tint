import type { CalendarEvent } from '../../components/calendar'

/**
 * A demo month for the Calendar page, shaped after the triage workflow the
 * component was extracted from: events that came from a real calendar sit
 * alongside ones a mail scanner proposed, and the host tells them apart by
 * `source` alone.
 *
 * Fixed to March 2026 so the page renders the same way every time. March 2026
 * opens on a Sunday, which keeps the first row unpadded and the multi-day bars
 * easy to read.
 */
export const DEMO_CALENDAR_MONTH = { year: 2026, month: 3 } as const

/** Pinned so `isToday` and the "Today" button are deterministic. */
export const DEMO_CALENDAR_TODAY = new Date(2026, 2, 12)

export const DEMO_CALENDAR_EVENTS: readonly CalendarEvent[] = [
  {
    id: 'evt-offsite',
    title: 'Engineering offsite',
    allDay: true,
    start: '2026-03-03',
    end: '2026-03-06',
    location: 'Portland',
    source: 'calendar',
  },
  {
    id: 'evt-freeze',
    title: 'Release freeze',
    allDay: true,
    start: '2026-03-09',
    end: '2026-03-14',
    source: 'calendar',
    description: 'No deploys to production while the freeze is active.',
  },
  {
    id: 'evt-onboarding',
    title: 'Onboarding week',
    allDay: true,
    start: '2026-03-11',
    end: '2026-03-17',
    source: 'calendar',
  },
  {
    id: 'evt-standup-tue',
    title: 'Standup',
    start: '2026-03-10T09:15:00',
    end: '2026-03-10T09:30:00',
    source: 'calendar',
  },
  {
    id: 'evt-review',
    title: 'Design review',
    start: '2026-03-10T11:00:00',
    end: '2026-03-10T12:00:00',
    source: 'calendar',
  },
  {
    id: 'evt-1on1',
    title: '1:1',
    start: '2026-03-10T15:00:00',
    end: '2026-03-10T15:30:00',
    source: 'calendar',
  },
  {
    // A fourth event on the 10th, so the "+N more" affordance is visible.
    id: 'evt-retro',
    title: 'Retro',
    start: '2026-03-10T16:00:00',
    end: '2026-03-10T17:00:00',
    source: 'calendar',
  },
  {
    id: 'evt-invoice',
    title: 'Invoice due — Northwind',
    start: '2026-03-19T09:00:00',
    end: '2026-03-19T09:30:00',
    source: 'proposed',
    status: 'tentative',
    description: 'Parsed from an email; not yet accepted onto the calendar.',
  },
  {
    id: 'evt-flight',
    title: 'Flight to SFO',
    start: '2026-03-24T06:40:00',
    end: '2026-03-24T09:55:00',
    source: 'proposed',
    status: 'tentative',
  },
  {
    id: 'evt-conf',
    title: 'Conference',
    allDay: true,
    start: '2026-03-24T00:00:00',
    end: '2026-03-28',
    source: 'accepted',
  },
  {
    id: 'evt-cancelled',
    title: 'Vendor sync',
    start: '2026-03-18T13:00:00',
    end: '2026-03-18T13:45:00',
    source: 'calendar',
    status: 'cancelled',
  },
  {
    // Ends exactly at midnight — it belongs to the 26th only, not the 27th.
    id: 'evt-late',
    title: 'On-call shift',
    start: '2026-03-26T18:00:00',
    end: '2026-03-27T00:00:00',
    source: 'calendar',
  },
]
