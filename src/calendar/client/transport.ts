/**
 * The HTTP seam.
 *
 * The client never calls `fetch` itself. A host supplies this, which is what
 * lets credentials, proxying, retries, and cookie handling stay the host's
 * business — the same division `auth-client` draws. It also makes the client
 * testable without a server, and usable from a Node process that proxies CalDAV
 * on a browser's behalf (which is the normal deployment, since CalDAV servers
 * rarely send usable CORS headers).
 */
export type CalDavRequest = {
  method: 'PROPFIND' | 'REPORT' | 'GET' | 'PUT' | 'DELETE' | 'OPTIONS'
  url: string
  headers: Record<string, string>
  body?: string
}

export type CalDavResponse = {
  status: number
  headers: Record<string, string>
  text: string
}

export type CalDavTransport = {
  send(request: CalDavRequest): Promise<CalDavResponse>
}

/**
 * A transport backed by the platform `fetch`.
 *
 * Offered as a convenience for server-side and same-origin-proxy use. Passing
 * credentials here is the host's decision: `init` is merged into every request,
 * so an `Authorization` header or `credentials: 'include'` goes there.
 */
export function createFetchTransport(
  init: RequestInit & { fetch?: typeof globalThis.fetch } = {},
): CalDavTransport {
  const { fetch: fetchImpl, ...rest } = init
  const doFetch = fetchImpl ?? globalThis.fetch
  return {
    async send(request) {
      const response = await doFetch(request.url, {
        ...rest,
        method: request.method,
        headers: { ...(rest.headers as Record<string, string>), ...request.headers },
        body: request.body,
      })
      const headers: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value
      })
      return { status: response.status, headers, text: await response.text() }
    },
  }
}
