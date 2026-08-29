/**
 * A CalDAV (RFC 4791) client: discovery, time-ranged reads, and ETag-guarded
 * writes.
 *
 * It speaks HTTP through an injected `CalDavTransport` and returns
 * `CalendarEvent`s, so the calendar components can render a real server without
 * either layer knowing about the other.
 *
 * On expansion: `calendar-query` may ask the server to expand recurrences, but
 * support is uneven and several widely-deployed servers ignore it or return
 * subtly wrong instances. This client therefore asks for the raw
 * `calendar-data` and expands locally with `recurrence.ts`, which is the same
 * answer everywhere. `expand: true` is available for servers known to do it
 * well.
 */

import type { CalendarEvent } from '../../components/calendar'
import { parseICalendar } from '../../components/calendar/ical'
import { expandCalendarEvents } from '../../components/calendar/recurrence'
import { CalDavError, calDavErrorForStatus } from './errors'
import type { CalDavRequest, CalDavTransport } from './transport'
import { encodeXml, find, findAll, parseXml, textOf } from './xml'

export type CalDavCalendar = {
  /** Absolute or server-relative collection path. */
  href: string
  displayName: string
  /** `getctag`: changes whenever anything in the collection changes. */
  ctag?: string
  /** Colour the server advertises, if any. */
  color?: string
  /** Component types the collection accepts, e.g. `['VEVENT']`. */
  supportedComponents: readonly string[]
}

/** One resource in a collection: an `.ics` file, which may hold several VEVENTs. */
export type CalDavResource = {
  href: string
  etag?: string
  /** Raw iCalendar. Absent from responses that only carried an ETag. */
  data?: string
}

export type CalDavClientOptions = {
  transport: CalDavTransport
  /** The server root or a user principal URL. */
  baseUrl: string
  /** Tags events from this account so a host can theme by origin. */
  source?: string
}

const XMLNS = 'xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"'
const APPLE_NS = 'xmlns:cs="http://calendarserver.org/ns/" xmlns:ic="http://apple.com/ns/ical/"'

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** RFC 4791 time-range bounds are always UTC `DATE-TIME`s. */
function toUtcStamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  )
}

/**
 * Resolve a possibly-relative href against the base.
 *
 * Servers return hrefs in every form — absolute URLs, absolute paths, and
 * occasionally relative ones — and a client that assumes one shape breaks on
 * the others.
 */
function resolveHref(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).toString()
  } catch {
    return href
  }
}

export class CalDavClient {
  private readonly transport: CalDavTransport
  private readonly baseUrl: string
  private readonly source?: string

  constructor(options: CalDavClientOptions) {
    this.transport = options.transport
    this.baseUrl = options.baseUrl
    this.source = options.source
  }

  private async request(request: CalDavRequest) {
    const response = await this.transport.send(request)
    // 207 Multi-Status is the success case for PROPFIND and REPORT.
    if (response.status >= 400) {
      throw calDavErrorForStatus(response.status, this.detailFrom(response.text))
    }
    return response
  }

  private detailFrom(body: string): string | undefined {
    if (!body) return undefined
    const root = parseXml(body)
    return root ? (textOf(root, 'responsedescription') ?? undefined) : undefined
  }

  /** `PROPFIND` for the principal, then its calendar home. RFC 4791 §6.2.1. */
  async discoverCalendarHome(): Promise<string> {
    const principalBody =
      `<?xml version="1.0" encoding="utf-8"?>` +
      `<d:propfind ${XMLNS}><d:prop><d:current-user-principal/></d:prop></d:propfind>`

    const principalResponse = await this.request({
      method: 'PROPFIND',
      url: this.baseUrl,
      headers: { Depth: '0', 'Content-Type': 'application/xml; charset=utf-8' },
      body: principalBody,
    })

    const principalRoot = parseXml(principalResponse.text)
    const principalHref = principalRoot
      ? find(principalRoot, 'current-user-principal')
        ? textOf(find(principalRoot, 'current-user-principal')!, 'href')
        : undefined
      : undefined
    if (!principalHref) {
      throw new CalDavError('no_calendar_home', 'Server did not return a current-user-principal.')
    }

    const homeBody =
      `<?xml version="1.0" encoding="utf-8"?>` +
      `<d:propfind ${XMLNS}><d:prop><c:calendar-home-set/></d:prop></d:propfind>`

    const homeResponse = await this.request({
      method: 'PROPFIND',
      url: resolveHref(principalHref, this.baseUrl),
      headers: { Depth: '0', 'Content-Type': 'application/xml; charset=utf-8' },
      body: homeBody,
    })

    const homeRoot = parseXml(homeResponse.text)
    const homeSet = homeRoot ? find(homeRoot, 'calendar-home-set') : undefined
    const homeHref = homeSet ? textOf(homeSet, 'href') : undefined
    if (!homeHref) {
      throw new CalDavError('no_calendar_home', 'Server did not return a calendar-home-set.')
    }
    return resolveHref(homeHref, this.baseUrl)
  }

  /**
   * Calendar collections in a home.
   *
   * Non-calendar collections and ones that do not accept `VEVENT` (a
   * to-do-only list, say) are filtered out.
   */
  async listCalendars(homeUrl?: string): Promise<CalDavCalendar[]> {
    const url = homeUrl ?? (await this.discoverCalendarHome())
    const body =
      `<?xml version="1.0" encoding="utf-8"?>` +
      `<d:propfind ${XMLNS} ${APPLE_NS}><d:prop>` +
      `<d:resourcetype/><d:displayname/><cs:getctag/>` +
      `<c:supported-calendar-component-set/><ic:calendar-color/>` +
      `</d:prop></d:propfind>`

    const response = await this.request({
      method: 'PROPFIND',
      url,
      headers: { Depth: '1', 'Content-Type': 'application/xml; charset=utf-8' },
      body,
    })

    const root = parseXml(response.text)
    if (!root) throw new CalDavError('malformed_response', 'PROPFIND returned no XML.')

    const calendars: CalDavCalendar[] = []
    for (const entry of findAll(root, 'response')) {
      const resourceType = find(entry, 'resourcetype')
      if (!resourceType || !find(resourceType, 'calendar')) continue

      const components = findAll(entry, 'comp')
        .map((comp) => comp.attributes.name?.toUpperCase())
        .filter((name): name is string => Boolean(name))
      // An empty set means the server did not say; assume it takes events.
      if (components.length > 0 && !components.includes('VEVENT')) continue

      const href = textOf(entry, 'href')
      if (!href) continue

      calendars.push({
        href: resolveHref(href, url),
        displayName: textOf(entry, 'displayname') ?? href,
        ...(textOf(entry, 'getctag') ? { ctag: textOf(entry, 'getctag') } : {}),
        ...(textOf(entry, 'calendar-color') ? { color: textOf(entry, 'calendar-color') } : {}),
        supportedComponents: components.length > 0 ? components : ['VEVENT'],
      })
    }
    return calendars
  }

  /** Raw resources in a collection overlapping the window. RFC 4791 §7.8. */
  async queryResources(
    calendarHref: string,
    window: { from: Date; to: Date },
    options: { expand?: boolean } = {},
  ): Promise<CalDavResource[]> {
    const range = `<c:time-range start="${toUtcStamp(window.from)}" end="${toUtcStamp(window.to)}"/>`
    const calendarData = options.expand
      ? `<c:calendar-data><c:expand start="${toUtcStamp(window.from)}" end="${toUtcStamp(window.to)}"/></c:calendar-data>`
      : `<c:calendar-data/>`

    const body =
      `<?xml version="1.0" encoding="utf-8"?>` +
      `<c:calendar-query ${XMLNS}>` +
      `<d:prop><d:getetag/>${calendarData}</d:prop>` +
      `<c:filter><c:comp-filter name="VCALENDAR">` +
      `<c:comp-filter name="VEVENT">${range}</c:comp-filter>` +
      `</c:comp-filter></c:filter>` +
      `</c:calendar-query>`

    const response = await this.request({
      method: 'REPORT',
      url: calendarHref,
      headers: { Depth: '1', 'Content-Type': 'application/xml; charset=utf-8' },
      body,
    })

    const root = parseXml(response.text)
    if (!root) throw new CalDavError('malformed_response', 'REPORT returned no XML.')

    const resources: CalDavResource[] = []
    for (const entry of findAll(root, 'response')) {
      const href = textOf(entry, 'href')
      if (!href) continue
      resources.push({
        href: resolveHref(href, calendarHref),
        ...(textOf(entry, 'getetag') ? { etag: textOf(entry, 'getetag') } : {}),
        ...(textOf(entry, 'calendar-data') ? { data: textOf(entry, 'calendar-data') } : {}),
      })
    }
    return resources
  }

  /**
   * Events in a collection over a window, ready to render.
   *
   * Recurrences are expanded locally unless `expand` asked the server to do it.
   * Because one `.ics` resource can hold a master plus its `RECURRENCE-ID`
   * overrides, each resource is expanded as a unit — that is what lets an
   * override replace its instance rather than appear beside it.
   */
  async listEvents(
    calendarHref: string,
    window: { from: Date; to: Date },
    options: { expand?: boolean } = {},
  ): Promise<CalendarEvent[]> {
    const resources = await this.queryResources(calendarHref, window, options)
    return resources.flatMap((resource) => {
      if (!resource.data) return []
      const parsed = parseICalendar(resource.data)
      return expandCalendarEvents(parsed, window, { source: this.source })
    })
  }

  /** Fetch one resource, with its current ETag for a later guarded write. */
  async getResource(href: string): Promise<CalDavResource> {
    const response = await this.request({
      method: 'GET',
      url: href,
      headers: { Accept: 'text/calendar' },
    })
    return {
      href,
      ...(response.headers.etag ? { etag: response.headers.etag } : {}),
      data: response.text,
    }
  }

  /**
   * Create or replace a resource.
   *
   * The ETag arguments are the whole point of the method. `ifMatch` makes an
   * update fail with `precondition_failed` rather than silently clobbering a
   * concurrent change; `ifNoneMatch` makes a create fail if something is
   * already there. Passing neither is a last-write-wins overwrite, which is
   * occasionally what you want and never what you want by accident.
   */
  async putResource(
    href: string,
    icalendar: string,
    options: { ifMatch?: string; ifNoneMatch?: boolean } = {},
  ): Promise<{ etag?: string }> {
    const headers: Record<string, string> = { 'Content-Type': 'text/calendar; charset=utf-8' }
    if (options.ifMatch) headers['If-Match'] = options.ifMatch
    else if (options.ifNoneMatch) headers['If-None-Match'] = '*'

    const response = await this.request({ method: 'PUT', url: href, headers, body: icalendar })
    return response.headers.etag ? { etag: response.headers.etag } : {}
  }

  /** Delete a resource, optionally guarded by its ETag. */
  async deleteResource(href: string, options: { ifMatch?: string } = {}): Promise<void> {
    const headers: Record<string, string> = {}
    if (options.ifMatch) headers['If-Match'] = options.ifMatch
    await this.request({ method: 'DELETE', url: href, headers })
  }

  /**
   * The collection's ctag — cheap change detection.
   *
   * Poll this instead of re-running a REPORT: it changes whenever anything in
   * the collection does, so an unchanged value means the last result is still
   * good.
   */
  async getCtag(calendarHref: string): Promise<string | undefined> {
    const body =
      `<?xml version="1.0" encoding="utf-8"?>` +
      `<d:propfind ${XMLNS} ${APPLE_NS}><d:prop><cs:getctag/></d:prop></d:propfind>`
    const response = await this.request({
      method: 'PROPFIND',
      url: calendarHref,
      headers: { Depth: '0', 'Content-Type': 'application/xml; charset=utf-8' },
      body,
    })
    const root = parseXml(response.text)
    return root ? textOf(root, 'getctag') : undefined
  }
}

export function createCalDavClient(options: CalDavClientOptions): CalDavClient {
  return new CalDavClient(options)
}

/** Escape a value for interpolation into a request body. */
export { encodeXml }
