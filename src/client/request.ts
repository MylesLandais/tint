import type { RequestAdapter, TintRequest, TintResponseType } from './types'

export type FetchRequestAdapterOptions = {
  fetch?: typeof globalThis.fetch
  init?: Omit<RequestInit, 'method' | 'headers' | 'body' | 'signal'>
}

function isBodyInit(value: unknown): value is BodyInit {
  return typeof value === 'string'
    || value instanceof Blob
    || value instanceof FormData
    || value instanceof URLSearchParams
    || value instanceof ArrayBuffer
    || ArrayBuffer.isView(value)
}

async function readResponse(response: Response, responseType?: TintResponseType): Promise<unknown> {
  const kind = responseType ?? (response.headers.get('content-type')?.includes('application/json') ? 'json' : 'text')
  if (response.status === 204 || response.status === 205) return undefined
  if (kind === 'blob') return response.blob()
  if (kind === 'arrayBuffer') return response.arrayBuffer()
  if (kind === 'json') return response.json()
  return response.text()
}

function operationSignal(request: TintRequest): { signal?: AbortSignal; release(): void } {
  if (request.deadlineMs == null) return { signal: request.signal, release() {} }
  const controller = new AbortController()
  const abort = () => controller.abort(request.signal?.reason)
  if (request.signal?.aborted) abort()
  else request.signal?.addEventListener('abort', abort, { once: true })
  const timer = setTimeout(() => controller.abort(new DOMException('Deadline exceeded', 'AbortError')), Math.max(0, request.deadlineMs))
  return {
    signal: controller.signal,
    release() { clearTimeout(timer); request.signal?.removeEventListener('abort', abort) },
  }
}

/** Platform-fetch implementation of the endpoint-neutral request seam. */
export function createFetchRequestAdapter(options: FetchRequestAdapterOptions = {}): RequestAdapter {
  const fetchImpl = options.fetch ?? globalThis.fetch
  return {
    async send<T, TBody>(request: TintRequest<TBody>) {
      const headers = new Headers(request.headers)
      const body = request.body == null ? undefined : isBodyInit(request.body) ? request.body : JSON.stringify(request.body)
      if (body && !isBodyInit(request.body) && !headers.has('content-type')) headers.set('content-type', 'application/json')
      const operation = operationSignal(request)
      try {
        const response = await fetchImpl(request.url, { ...options.init, method: request.method, headers, body, signal: operation.signal })
        const responseHeaders: Record<string, string> = {}
        response.headers.forEach((value, key) => { responseHeaders[key] = value })
        return {
          status: response.status,
          headers: responseHeaders,
          data: await readResponse(response, request.responseType) as T,
          requestId: request.requestId ?? response.headers.get('x-request-id') ?? undefined,
        }
      } finally {
        operation.release()
      }
    },
  }
}
