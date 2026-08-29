import { describe, expect, it, vi } from 'vitest'
import { CalDavClient } from './client'
import { CalDavError } from './errors'
import type { CalDavRequest, CalDavResponse, CalDavTransport } from './transport'
import { parseXml, findAll, textOf, decodeEntities } from './xml'

/** Records what was sent and replies from a scripted queue. */
class FakeTransport implements CalDavTransport {
  readonly sent: CalDavRequest[] = []
  private readonly replies: (CalDavResponse | ((r: CalDavRequest) => CalDavResponse))[]
  constructor(replies: (CalDavResponse | ((r: CalDavRequest) => CalDavResponse))[]) {
    this.replies = replies
  }
  async send(request: CalDavRequest): Promise<CalDavResponse> {
    this.sent.push(request)
    const reply = this.replies.shift()
    if (!reply) throw new Error(`unexpected ${request.method} ${request.url}`)
    return typeof reply === 'function' ? reply(request) : reply
  }
}

const ok = (text: string, headers: Record<string, string> = {}): CalDavResponse => ({
  status: 207,
  headers,
  text,
})

const BASE = 'https://dav.example.com/'

describe('xml reader', () => {
  it('matches on local name whatever prefix the server uses', () => {
    const a = parseXml('<d:multistatus xmlns:d="DAV:"><d:href>/a</d:href></d:multistatus>')!
    const b = parseXml('<multistatus xmlns="DAV:"><href>/a</href></multistatus>')!
    const c = parseXml('<D:multistatus xmlns:D="DAV:"><D:href>/a</D:href></D:multistatus>')!
    for (const root of [a, b, c]) expect(textOf(root, 'href')).toBe('/a')
  })

  it('handles self-closing elements and attributes', () => {
    const root = parseXml('<prop><resourcetype><calendar/></resourcetype><comp name="VEVENT"/></prop>')!
    expect(findAll(root, 'calendar')).toHaveLength(1)
    expect(findAll(root, 'comp')[0]!.attributes.name).toBe('VEVENT')
  })

  it('decodes entities, including numeric ones', () => {
    expect(decodeEntities('a &amp; b &lt;c&gt; &#65; &#x42;')).toBe('a & b <c> A B')
  })

  it('ignores the prologue, comments, and doctype', () => {
    const root = parseXml('<?xml version="1.0"?><!-- hi --><a><b>x</b></a>')!
    expect(root.name).toBe('a')
    expect(textOf(root, 'b')).toBe('x')
  })
})

describe('discovery', () => {
  it('walks principal then calendar-home-set', async () => {
    const transport = new FakeTransport([
      ok(
        `<d:multistatus xmlns:d="DAV:"><d:response><d:propstat><d:prop>
           <d:current-user-principal><d:href>/principals/me/</d:href></d:current-user-principal>
         </d:prop></d:propstat></d:response></d:multistatus>`,
      ),
      ok(
        `<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:response><d:propstat><d:prop>
           <c:calendar-home-set><d:href>/calendars/me/</d:href></c:calendar-home-set>
         </d:prop></d:propstat></d:response></d:multistatus>`,
      ),
    ])
    const client = new CalDavClient({ transport, baseUrl: BASE })
    expect(await client.discoverCalendarHome()).toBe('https://dav.example.com/calendars/me/')
    expect(transport.sent.map((request) => request.method)).toEqual(['PROPFIND', 'PROPFIND'])
    expect(transport.sent[0]!.headers.Depth).toBe('0')
  })

  it('raises no_calendar_home rather than returning undefined', async () => {
    const transport = new FakeTransport([ok('<d:multistatus xmlns:d="DAV:"></d:multistatus>')])
    const client = new CalDavClient({ transport, baseUrl: BASE })
    await expect(client.discoverCalendarHome()).rejects.toMatchObject({ code: 'no_calendar_home' })
  })
})

describe('listCalendars', () => {
  const HOME = 'https://dav.example.com/calendars/me/'

  const body = `<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"
      xmlns:cs="http://calendarserver.org/ns/" xmlns:ic="http://apple.com/ns/ical/">
    <d:response>
      <d:href>/calendars/me/</d:href>
      <d:propstat><d:prop><d:resourcetype><d:collection/></d:resourcetype></d:prop></d:propstat>
    </d:response>
    <d:response>
      <d:href>/calendars/me/work/</d:href>
      <d:propstat><d:prop>
        <d:resourcetype><d:collection/><c:calendar/></d:resourcetype>
        <d:displayname>Work</d:displayname>
        <cs:getctag>ctag-1</cs:getctag>
        <ic:calendar-color>#FF0000</ic:calendar-color>
        <c:supported-calendar-component-set><c:comp name="VEVENT"/></c:supported-calendar-component-set>
      </d:prop></d:propstat>
    </d:response>
    <d:response>
      <d:href>/calendars/me/tasks/</d:href>
      <d:propstat><d:prop>
        <d:resourcetype><d:collection/><c:calendar/></d:resourcetype>
        <d:displayname>Tasks</d:displayname>
        <c:supported-calendar-component-set><c:comp name="VTODO"/></c:supported-calendar-component-set>
      </d:prop></d:propstat>
    </d:response>
  </d:multistatus>`

  it('keeps only VEVENT calendars, skipping plain collections and to-do lists', async () => {
    const client = new CalDavClient({ transport: new FakeTransport([ok(body)]), baseUrl: BASE })
    const calendars = await client.listCalendars(HOME)
    expect(calendars).toHaveLength(1)
    expect(calendars[0]).toMatchObject({
      href: 'https://dav.example.com/calendars/me/work/',
      displayName: 'Work',
      ctag: 'ctag-1',
      color: '#FF0000',
    })
  })

  it('assumes VEVENT when the server does not declare components', async () => {
    const quiet = `<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:response>
      <d:href>/calendars/me/x/</d:href>
      <d:propstat><d:prop>
        <d:resourcetype><d:collection/><c:calendar/></d:resourcetype>
        <d:displayname>X</d:displayname>
      </d:prop></d:propstat></d:response></d:multistatus>`
    const client = new CalDavClient({ transport: new FakeTransport([ok(quiet)]), baseUrl: BASE })
    const [calendar] = await client.listCalendars(HOME)
    expect(calendar!.supportedComponents).toEqual(['VEVENT'])
  })
})

describe('listEvents', () => {
  const CAL = 'https://dav.example.com/calendars/me/work/'
  const window = { from: new Date('2026-03-01T00:00:00Z'), to: new Date('2026-03-31T23:59:59Z') }

  function report(icalendar: string) {
    return ok(
      `<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:response>
         <d:href>/calendars/me/work/a.ics</d:href>
         <d:propstat><d:prop>
           <d:getetag>"etag-1"</d:getetag>
           <c:calendar-data>${icalendar.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</c:calendar-data>
         </d:prop></d:propstat>
       </d:response></d:multistatus>`,
    )
  }

  it('sends a time-range filtered calendar-query', async () => {
    const transport = new FakeTransport([report('BEGIN:VCALENDAR\r\nEND:VCALENDAR')])
    const client = new CalDavClient({ transport, baseUrl: BASE })
    await client.listEvents(CAL, window)

    const request = transport.sent[0]!
    expect(request.method).toBe('REPORT')
    expect(request.headers.Depth).toBe('1')
    expect(request.body).toContain('<c:comp-filter name="VEVENT">')
    expect(request.body).toContain('start="20260301T000000Z"')
    expect(request.body).toContain('end="20260331T235959Z"')
    // Raw data by default — expansion is done locally.
    expect(request.body).toContain('<c:calendar-data/>')
  })

  it('asks the server to expand only when told to', async () => {
    const transport = new FakeTransport([report('BEGIN:VCALENDAR\r\nEND:VCALENDAR')])
    const client = new CalDavClient({ transport, baseUrl: BASE })
    await client.listEvents(CAL, window, { expand: true })
    expect(transport.sent[0]!.body).toContain('<c:expand')
  })

  it('expands a recurring event locally into instances', async () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:weekly',
      'DTSTART:20260302T090000Z',
      'DTEND:20260302T093000Z',
      'RRULE:FREQ=WEEKLY;BYDAY=MO',
      'SUMMARY:Standup',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const client = new CalDavClient({
      transport: new FakeTransport([report(ics)]),
      baseUrl: BASE,
      source: 'work',
    })
    const events = await client.listEvents(CAL, window)
    expect(events).toHaveLength(5)
    expect(new Set(events.map((event) => event.id)).size).toBe(5)
    expect(events.every((event) => event.source === 'work')).toBe(true)
  })

  it('applies a RECURRENCE-ID override inside a single resource', async () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:ov',
      'DTSTART:20260302T090000Z',
      'DTEND:20260302T093000Z',
      'RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=3',
      'SUMMARY:Standup',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'UID:ov',
      'RECURRENCE-ID:20260309T090000Z',
      'DTSTART:20260310T140000Z',
      'DTEND:20260310T143000Z',
      'SUMMARY:Standup (moved)',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const client = new CalDavClient({ transport: new FakeTransport([report(ics)]), baseUrl: BASE })
    const events = await client.listEvents(CAL, window)
    expect(events).toHaveLength(3)
    expect(events.filter((event) => event.title === 'Standup (moved)')).toHaveLength(1)
  })
})

describe('writes', () => {
  const HREF = 'https://dav.example.com/calendars/me/work/a.ics'

  it('guards an update with If-Match', async () => {
    const transport = new FakeTransport([{ status: 204, headers: { etag: '"etag-2"' }, text: '' }])
    const client = new CalDavClient({ transport, baseUrl: BASE })
    const result = await client.putResource(HREF, 'BEGIN:VCALENDAR\r\nEND:VCALENDAR', {
      ifMatch: '"etag-1"',
    })
    expect(transport.sent[0]!.headers['If-Match']).toBe('"etag-1"')
    expect(result.etag).toBe('"etag-2"')
  })

  it('guards a create with If-None-Match', async () => {
    const transport = new FakeTransport([{ status: 201, headers: {}, text: '' }])
    const client = new CalDavClient({ transport, baseUrl: BASE })
    await client.putResource(HREF, 'x', { ifNoneMatch: true })
    expect(transport.sent[0]!.headers['If-None-Match']).toBe('*')
  })

  it('sends no guard when none was asked for', async () => {
    const transport = new FakeTransport([{ status: 204, headers: {}, text: '' }])
    const client = new CalDavClient({ transport, baseUrl: BASE })
    await client.putResource(HREF, 'x')
    expect(transport.sent[0]!.headers['If-Match']).toBeUndefined()
    expect(transport.sent[0]!.headers['If-None-Match']).toBeUndefined()
  })

  it('reports a lost ETag race as precondition_failed', async () => {
    const transport = new FakeTransport([{ status: 412, headers: {}, text: '' }])
    const client = new CalDavClient({ transport, baseUrl: BASE })
    await expect(client.putResource(HREF, 'x', { ifMatch: '"stale"' })).rejects.toMatchObject({
      code: 'precondition_failed',
      status: 412,
    })
  })

  it('deletes with an optional guard', async () => {
    const transport = new FakeTransport([{ status: 204, headers: {}, text: '' }])
    const client = new CalDavClient({ transport, baseUrl: BASE })
    await client.deleteResource(HREF, { ifMatch: '"etag-1"' })
    expect(transport.sent[0]).toMatchObject({ method: 'DELETE', headers: { 'If-Match': '"etag-1"' } })
  })
})

describe('errors', () => {
  it.each([
    [401, 'unauthorized'],
    [403, 'forbidden'],
    [404, 'not_found'],
    [500, 'request_failed'],
  ])('maps HTTP %i to %s', async (status, code) => {
    const client = new CalDavClient({
      transport: new FakeTransport([{ status, headers: {}, text: '' }]),
      baseUrl: BASE,
    })
    await expect(client.getResource('https://dav.example.com/x.ics')).rejects.toBeInstanceOf(
      CalDavError,
    )
    await expect(
      new CalDavClient({
        transport: new FakeTransport([{ status, headers: {}, text: '' }]),
        baseUrl: BASE,
      }).getResource('https://dav.example.com/x.ics'),
    ).rejects.toMatchObject({ code })
  })

  it('surfaces a server responsedescription', async () => {
    const client = new CalDavClient({
      transport: new FakeTransport([
        {
          status: 403,
          headers: {},
          text: '<d:error xmlns:d="DAV:"><d:responsedescription>Quota exceeded</d:responsedescription></d:error>',
        },
      ]),
      baseUrl: BASE,
    })
    await expect(client.getResource('https://dav.example.com/x.ics')).rejects.toThrow(
      'Quota exceeded',
    )
  })
})

describe('getCtag', () => {
  it('reads the collection ctag for cheap change detection', async () => {
    const transport = new FakeTransport([
      ok(
        `<d:multistatus xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/"><d:response>
           <d:propstat><d:prop><cs:getctag>ctag-9</cs:getctag></d:prop></d:propstat>
         </d:response></d:multistatus>`,
      ),
    ])
    const client = new CalDavClient({ transport, baseUrl: BASE })
    expect(await client.getCtag('https://dav.example.com/calendars/me/work/')).toBe('ctag-9')
  })
})

describe('createFetchTransport', () => {
  it('passes method, headers, and body through and lowercases response headers', async () => {
    const { createFetchTransport } = await import('./transport')
    const fetchImpl = vi.fn(async () =>
      new Response('body', { status: 207, headers: { ETag: '"e"' } }),
    )
    const transport = createFetchTransport({ fetch: fetchImpl as unknown as typeof fetch })
    const response = await transport.send({
      method: 'REPORT',
      url: 'https://x/',
      headers: { Depth: '1' },
      body: 'xml',
    })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://x/',
      expect.objectContaining({ method: 'REPORT', body: 'xml' }),
    )
    expect(response.headers.etag).toBe('"e"')
    expect(response.text).toBe('body')
  })
})
