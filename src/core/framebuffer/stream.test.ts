import { afterEach, describe, expect, it, vi } from 'vitest'
import { FramebufferStream } from './stream'
import { rgbaPresenter } from './rgbaPresenter'

const presenter = vi.hoisted(() => ({ draw: vi.fn(), destroy: vi.fn(), backend: 'test' }))
vi.mock('./rgbaPresenter', () => ({ rgbaPresenter: vi.fn().mockResolvedValue(presenter) }))

class SocketStub {
  static OPEN = 1
  static instances: SocketStub[] = []
  binaryType = ''
  readyState = SocketStub.OPEN
  onopen: (() => void) | null = null
  onmessage: ((event: { data: ArrayBuffer }) => void) | null = null
  onclose: (() => void) | null = null
  onerror: (() => void) | null = null
  sent: string[] = []

  readonly url: string
  constructor(url: string) { this.url = url; SocketStub.instances.push(this) }
  send(data: string) { this.sent.push(data) }
  close() { this.readyState = 3; this.onclose?.() }
}

function frame(): ArrayBuffer {
  const header = new TextEncoder().encode(JSON.stringify({ account_id: 'one', session_id: 'session', frame_id: 1, width: 1, height: 1 }))
  const bytes = new Uint8Array(header.length + 8)
  new DataView(bytes.buffer).setUint32(0, header.length)
  bytes.set(header, 4)
  bytes.set([255, 0, 0, 255], header.length + 4)
  return bytes.buffer
}

afterEach(() => {
  SocketStub.instances = []
  presenter.draw.mockClear()
  presenter.destroy.mockClear()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  vi.mocked(rgbaPresenter).mockClear()
})

describe('FramebufferStream', () => {
  it('connects, validates a frame, presents pixels, and disposes the socket and presenter', async () => {
    vi.stubGlobal('WebSocket', SocketStub)
    const canvas = document.createElement('canvas')
    const statuses: string[] = []
    const stream = new FramebufferStream(canvas, { url: 'ws://example.test/frames', accountId: 'one', encoding: 'rgba', mode: 'frame', onContextLost: vi.fn() }, (status) => statuses.push(status))
    stream.start()
    await vi.waitFor(() => expect(SocketStub.instances).toHaveLength(1))
    const socket = SocketStub.instances[0]
    socket.onmessage?.({ data: frame() })
    await vi.waitFor(() => expect(presenter.draw).toHaveBeenCalledOnce())
    expect(canvas.dataset.frameId).toBe('1')
    expect(canvas.dataset.sessionId).toBe('session')
    expect(canvas.dataset.backend).toBe('test')
    expect(statuses).toEqual(['Connecting', 'Live'])
    stream.dispose()
    expect(socket.readyState).toBe(3)
    expect(presenter.destroy).toHaveBeenCalledOnce()
  })

  it('reuses the selected backend after a socket reconnect', async () => {
    vi.stubGlobal('WebSocket', SocketStub)
    const stream = new FramebufferStream(document.createElement('canvas'), {
      url: 'ws://example.test/frames', accountId: 'one', encoding: 'rgba', mode: 'frame', onContextLost: vi.fn(),
    }, vi.fn())
    stream.start()
    await vi.waitFor(() => expect(SocketStub.instances).toHaveLength(1))
    vi.useFakeTimers()
    SocketStub.instances[0].close()
    await vi.advanceTimersByTimeAsync(1000)
    expect(SocketStub.instances).toHaveLength(2)
    expect(vi.mocked(rgbaPresenter)).toHaveBeenNthCalledWith(2, expect.any(HTMLCanvasElement), undefined)
    stream.dispose()
  })

  it('asks its host for a fresh canvas after rendering context loss', async () => {
    vi.stubGlobal('WebSocket', SocketStub)
    const onContextLost = vi.fn()
    const canvas = document.createElement('canvas')
    const stream = new FramebufferStream(canvas, {
      url: 'ws://example.test/frames', accountId: 'one', encoding: 'rgba', mode: 'frame', onContextLost,
    }, vi.fn())
    stream.start()
    await vi.waitFor(() => expect(SocketStub.instances).toHaveLength(1))
    const event = new Event('framecontextlost', { cancelable: true })
    canvas.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(onContextLost).toHaveBeenCalledOnce()
    expect(SocketStub.instances[0].readyState).toBe(3)
    canvas.dispatchEvent(new Event('framecontextlost'))
    expect(onContextLost).toHaveBeenCalledOnce()
    stream.dispose()
  })
})
