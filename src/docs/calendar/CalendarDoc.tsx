import { useMemo, useState } from 'react'
import {
  CalendarMonthView,
  CalendarToolbar,
  eventDateRange,
  type CalendarEvent,
} from '../../components/calendar'
import { Badge } from '../../components/badge'
import { CodeBlock } from '../components/CodeBlock'
import { DocsCallout, DocsPage, DocsPreview, DocsSection } from '../components/DocsPage'
import { PropsTable } from '../components/PropsTable'
import {
  DEMO_CALENDAR_EVENTS,
  DEMO_CALENDAR_MONTH,
  DEMO_CALENDAR_TODAY,
} from '../fixtures/demoCalendar'

const usage = `import { CalendarMonthView, CalendarToolbar } from 'tint/calendar'

// The host owns the month and the selection; the grid owns neither.
const [view, setView] = useState({ year: 2026, month: 3 })

<CalendarToolbar {...view} onNavigate={setView} />
<CalendarMonthView
  {...view}
  events={events}
  selectedDate={selected}
  onSelectDate={setSelected}
  onSelectEvent={(event) => open(event.id)}
/>`

const signature = `type CalendarEvent = {
  id: string          // VEVENT UID
  title: string       // SUMMARY
  start: string       // DTSTART, ISO 8601
  end: string         // DTEND — exclusive, per RFC 5545
  allDay?: boolean    // DTSTART;VALUE=DATE
  description?: string
  location?: string
  url?: string
  status?: 'confirmed' | 'tentative' | 'cancelled'
  source?: string     // an open label the host themes
  payload?: unknown
}`

const themingCode = `/* \`source\` is an open string. Tint puts it on the DOM and stops there,
   so a host can colour its own categories without tint knowing them. */
[data-tint-calendar-event][data-source='proposed'] {
  border: 1px dashed var(--tint-border-strong);
  background: transparent;
}
[data-tint-calendar-span][data-source='accepted'] {
  background: var(--tint-success);
}`

/** Mirrors the source legend the fixture uses. */
const LEGEND: readonly { source: string; label: string }[] = [
  { source: 'calendar', label: 'From the calendar' },
  { source: 'proposed', label: 'Proposed from email' },
  { source: 'accepted', label: 'Accepted onto the calendar' },
]

function CalendarWorkbench() {
  const [view, setView] = useState<{ year: number; month: number }>({
    year: DEMO_CALENDAR_MONTH.year,
    month: DEMO_CALENDAR_MONTH.month,
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return []
    return DEMO_CALENDAR_EVENTS.filter((event) => {
      const { startKey, endKey } = eventDateRange(event)
      return startKey <= selectedDate && selectedDate <= endKey
    })
  }, [selectedDate])

  return (
    <div className="flex flex-col gap-3">
      <CalendarToolbar
        year={view.year}
        month={view.month}
        onNavigate={setView}
        today={DEMO_CALENDAR_TODAY}
      />

      <CalendarMonthView
        year={view.year}
        month={view.month}
        events={DEMO_CALENDAR_EVENTS}
        today={DEMO_CALENDAR_TODAY}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          setSelectedDate(date)
          setSelectedEvent(null)
        }}
        onSelectEvent={setSelectedEvent}
        label="Demo calendar"
      />

      <div className="flex flex-wrap items-center gap-3 text-xs text-tint-muted">
        {LEGEND.map((entry) => (
          <span key={entry.source} className="flex items-center gap-1.5">
            <Badge tone={entry.source === 'proposed' ? 'warning' : 'accent'}>{entry.source}</Badge>
            {entry.label}
          </span>
        ))}
      </div>

      <div className="rounded-lg border border-tint-border bg-tint-surface p-3 text-sm">
        {selectedEvent ? (
          <div className="flex flex-col gap-1">
            <strong className="text-tint-ink">{selectedEvent.title}</strong>
            <span className="text-xs text-tint-muted">
              {selectedEvent.start} → {selectedEvent.end}
              {selectedEvent.location ? ` · ${selectedEvent.location}` : ''}
            </span>
            {selectedEvent.description ? (
              <span className="text-xs text-tint-muted">{selectedEvent.description}</span>
            ) : null}
          </div>
        ) : selectedDate ? (
          <div className="flex flex-col gap-1">
            <strong className="text-tint-ink">{selectedDate}</strong>
            <span className="text-xs text-tint-muted">
              {selectedDayEvents.length === 0
                ? 'Nothing scheduled.'
                : selectedDayEvents.map((event) => event.title).join(' · ')}
            </span>
          </div>
        ) : (
          <span className="text-tint-muted">
            Pick a day or an event. Selection is host state; the grid holds none.
          </span>
        )}
      </div>
    </div>
  )
}

export function CalendarDoc() {
  return (
    <DocsPage
      route="components/calendar"
      title="Calendar"
      intro="A controlled month grid. Single-day events sit in their cell; multi-day events are packed into lanes and drawn as continuous bars across the week."
    >
      <DocsSection id="preview" title="Workbench">
        <DocsPreview>
          <CalendarWorkbench />
        </DocsPreview>
        <p className="mt-3 text-sm text-tint-muted">
          The 10th carries four events against a <code>maxEventsPerDay</code> of three, so the
          overflow affordance is visible. The on-call shift on the 26th ends at exactly
          midnight and stays a one-day event rather than bleeding into the 27th.
        </p>
      </DocsSection>

      <DocsSection id="usage" title="Usage">
        <CodeBlock code={usage} />

        <DocsCallout variant="note" title="What this component does not do">
          <p className="m-0">
            No fetching, no recurrence expansion, and no time-zone resolution. Hand it events
            that are already single instances in the zone you want drawn. A CalDAV or Google
            sync belongs in the host, the same way every other tint package leaves transport
            to its consumer.
          </p>
        </DocsCallout>

        <h3 className="mt-6 mb-3 text-lg font-semibold tracking-tight text-tint-ink">
          The event shape
        </h3>
        <p className="mb-3 text-sm text-tint-muted">
          Field names follow RFC 5545 (iCalendar) rather than any one provider's JSON, so a
          CalDAV <code>VEVENT</code>, a Google event, or a hand-built fixture all normalise
          into the same object. Note that <code>end</code> is <strong>exclusive</strong>: an
          all-day event on the 3rd ends <code>2026-03-04</code>. <code>eventDateRange</code>{' '}
          converts to the inclusive day keys the grid draws.
        </p>
        <CodeBlock code={signature} />

        <h3 className="mt-6 mb-3 text-lg font-semibold tracking-tight text-tint-ink">Theming</h3>
        <p className="mb-3 text-sm text-tint-muted">
          Events and spans carry <code>data-source</code> and <code>data-status</code>. Tint
          never interprets <code>source</code> — it is the seam a host uses to colour its own
          categories.
        </p>
        <CodeBlock code={themingCode} language="css" />
      </DocsSection>

      <DocsSection id="api" title="API">
        <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">
          CalendarMonthView
        </h3>
        <PropsTable
          rows={[
            { name: 'year', type: 'number', required: true, description: 'Year to render.' },
            {
              name: 'month',
              type: 'number',
              required: true,
              description: 'Month to render, 1-12 — not the 0-based Date convention.',
            },
            {
              name: 'events',
              type: 'readonly CalendarEvent[]',
              required: true,
              description: 'Already-resolved single instances. Order does not matter.',
            },
            {
              name: 'weekStart',
              type: 'CalendarWeekStart (0-6)',
              defaultValue: '0',
              description: '0 is Sunday, matching Date.getDay().',
            },
            {
              name: 'today',
              type: 'Date',
              description: 'Which day gets the today marker. Injected so the grid is deterministic in tests; defaults to now.',
            },
            {
              name: 'maxEventsPerDay',
              type: 'number',
              defaultValue: '3',
              description: 'Events beyond this collapse into a "+N more" line.',
            },
            { name: 'selectedDate', type: 'string | null', description: 'Highlighted day key.' },
            {
              name: 'onSelectDate',
              type: '(date: string) => void',
              description: 'Day selection intent. Omit it and cells stop being focusable or clickable.',
            },
            {
              name: 'onSelectEvent',
              type: '(event: CalendarEvent) => void',
              description: 'Event selection intent. Does not also fire onSelectDate.',
            },
            {
              name: 'renderEvent',
              type: '(event: CalendarEvent) => ReactNode',
              description: 'Replaces the default chip for a single-day event.',
            },
            {
              name: 'renderSpan',
              type: '(span: CalendarSpan) => ReactNode',
              description: 'Replaces the default bar for a multi-day span.',
            },
            { name: 'label', type: 'string', description: 'Accessible name for the grid.' },
            { name: 'className', type: 'string', description: 'Optional class on the grid root.' },
          ]}
        />

        <div className="mt-8">
          <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">
            CalendarToolbar
          </h3>
          <PropsTable
            rows={[
              { name: 'year', type: 'number', required: true, description: 'Current year.' },
              { name: 'month', type: 'number', required: true, description: 'Current month, 1-12.' },
              {
                name: 'onNavigate',
                type: '(next: { year: number; month: number }) => void',
                required: true,
                description: 'Receives the computed target month. The toolbar holds no state.',
              },
              {
                name: 'today',
                type: 'Date',
                description: 'What the Today button navigates to; defaults to now.',
              },
              {
                name: 'locale',
                type: 'string',
                description: 'BCP 47 tag for the month label. Defaults to the runtime locale.',
              },
              { name: 'className', type: 'string', description: 'Optional class on the toolbar.' },
            ]}
          />
        </div>

        <div className="mt-8">
          <h3 className="mb-3 text-lg font-semibold tracking-tight text-tint-ink">
            Projection helpers
          </h3>
          <p className="mb-3 text-sm text-tint-muted">
            Pure and React-free, exported from <code>tint/calendar</code> for hosts that need
            the grid without the chrome.
          </p>
          <PropsTable
            rows={[
              {
                name: 'buildMonthGrid',
                type: '(year, month, events, options?) => CalendarMonth',
                description: 'The whole projection: padded weeks, day cells, and packed spans.',
              },
              {
                name: 'buildWeekSpans',
                type: '(weekDateKeys, events) => CalendarSpan[]',
                description: 'Greedy lane packing for one week — longest events first.',
              },
              {
                name: 'eventDateRange',
                type: '(event) => { startKey, endKey }',
                description: 'Inclusive local day range, applying the exclusive-DTEND and midnight-end rules.',
              },
              {
                name: 'enumerateDateKeys',
                type: '(startKey, endKey) => string[]',
                description: 'Every day key in an inclusive range.',
              },
              {
                name: 'dedupeEvents',
                type: '(primary, candidates) => CalendarEvent[]',
                description: 'Drops candidates matching an existing title on overlapping days.',
              },
              {
                name: 'isMultiDay / eventsOverlap',
                type: '(event) => boolean',
                description: 'Predicates over the same day-range logic.',
              },
              {
                name: 'toDateKey / fromDateKey',
                type: '(date) => string / (key) => Date',
                description: 'Local-zone day keys, never UTC.',
              },
              {
                name: 'nextCalendarMonth / previousCalendarMonth',
                type: '(year, month) => { year, month }',
                description: 'Month arithmetic that wraps across years.',
              },
            ]}
          />
        </div>
      </DocsSection>
    </DocsPage>
  )
}
