import { afterEach, describe, expect, it, vi } from 'vitest'
import { FramebufferStream } from './stream'
import { rgbaPresenter } from './rgbaPresenter'

const presenter = vi.hoisted(() => ({ draw: vi.fn(), drawBitmap: undefined as undefined | ((bitmap: ImageBitmap) => void), destroy: vi.fn(), backend: 'test' }))
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
  presenter.drawBitmap = undefined
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

  it('asks for its rate and size, uploads decoded PNGs directly, and acknowledges each frame', async () => {
    vi.stubGlobal('WebSocket', SocketStub)
    const bitmap = { width: 1, height: 1, close: vi.fn() }
    const decode = vi.fn().mockResolvedValue(bitmap)
    vi.stubGlobal('createImageBitmap', decode)
    presenter.drawBitmap = vi.fn()
    const stream = new FramebufferStream(document.createElement('canvas'), {
      url: 'ws://example.test/frames', accountId: 'one', encoding: 'png', mode: 'frame', fps: 60, maxWidth: 640, maxHeight: 360, onContextLost: vi.fn(),
    }, vi.fn())
    stream.start()
    await vi.waitFor(() => expect(SocketStub.instances).toHaveLength(1))
    const socket = SocketStub.instances[0]
    socket.onopen?.()
    expect(JSON.parse(socket.sent[0])).toEqual({ kind: 'frame', width: 640, height: 360, fps: 60, window: 2, paused: false })
    socket.onmessage?.({ data: frame() })
    await vi.waitFor(() => expect(presenter.drawBitmap).toHaveBeenCalledWith(bitmap))
    expect(decode.mock.calls[0][1]).toEqual({ premultiplyAlpha: 'none', colorSpaceConversion: 'none', imageOrientation: 'none' })
    expect(presenter.draw).not.toHaveBeenCalled()
    expect(bitmap.close).toHaveBeenCalledOnce()
    expect(socket.sent.at(-1)).toBe(JSON.stringify({ type: 'ack' }))
    stream.dispose()
  })

  it('acknowledges without decoding while the page is hidden', async () => {
    vi.stubGlobal('WebSocket', SocketStub)
    const decode = vi.fn()
    vi.stubGlobal('createImageBitmap', decode)
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    const stream = new FramebufferStream(document.createElement('canvas'), {
      url: 'ws://example.test/frames', accountId: 'one', encoding: 'png', mode: 'frame', onContextLost: vi.fn(),
    }, vi.fn())
    stream.start()
    await vi.waitFor(() => expect(SocketStub.instances).toHaveLength(1))
    const socket = SocketStub.instances[0]
    socket.onmessage?.({ data: frame() })
    await vi.waitFor(() => expect(socket.sent.at(-1)).toBe(JSON.stringify({ type: 'ack' })))
    expect(decode).not.toHaveBeenCalled()
    hidden.mockRestore()
    stream.dispose()
  })

  it('never draws an older frame over a newer one when decodes finish out of order', async () => {
    vi.stubGlobal('WebSocket', SocketStub)
    const slow = { width: 1, height: 1, close: vi.fn() }, fast = { width: 1, height: 1, close: vi.fn() }
    let release!: (bitmap: typeof slow) => void
    vi.stubGlobal('createImageBitmap', vi.fn()
      .mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
      .mockResolvedValueOnce(fast))
    presenter.drawBitmap = vi.fn()
    const stream = new FramebufferStream(document.createElement('canvas'), {
      url: 'ws://example.test/frames', accountId: 'one', encoding: 'png', mode: 'frame', onContextLost: vi.fn(),
    }, vi.fn())
    stream.start()
    await vi.waitFor(() => expect(SocketStub.instances).toHaveLength(1))
    const socket = SocketStub.instances[0]
    socket.onmessage?.({ data: frame() })
    socket.onmessage?.({ data: frame() })
    await vi.waitFor(() => expect(presenter.drawBitmap).toHaveBeenCalledWith(fast))
    release(slow)
    await vi.waitFor(() => expect(slow.close).toHaveBeenCalledOnce())
    expect(presenter.drawBitmap).toHaveBeenCalledTimes(1)
    expect(socket.sent.filter(message => message.includes('ack'))).toHaveLength(2)
    stream.dispose()
  })

  it('drops to one frame in flight while decoding cannot keep up, and asks for two again when it can', async () => {
    vi.stubGlobal('WebSocket', SocketStub)
    let decodeMs = 80, now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    vi.stubGlobal('createImageBitmap', vi.fn(async () => { now += decodeMs; return { width: 1, height: 1, close: vi.fn() } }))
    presenter.drawBitmap = vi.fn()
    const stream = new FramebufferStream(document.createElement('canvas'), {
      url: 'ws://example.test/frames', accountId: 'one', encoding: 'png', mode: 'frame', fps: 60, onContextLost: vi.fn(),
    }, vi.fn())
    stream.start()
    await vi.waitFor(() => expect(SocketStub.instances).toHaveLength(1))
    const socket = SocketStub.instances[0]
    const windows = () => socket.sent.filter(m => m.includes('window')).map(m => JSON.parse(m).window)
    socket.onopen?.()
    socket.onmessage?.({ data: frame() })
    await vi.waitFor(() => expect(windows().at(-1)).toBe(1))
    decodeMs = 2
    for (let i = 0; i < 40; i++) { socket.onmessage?.({ data: frame() }); await vi.waitFor(() => expect(presenter.drawBitmap).toHaveBeenCalledTimes(i + 2)) }
    expect(windows().at(-1)).toBe(2)
    stream.dispose()
  })

  it('decodes H.264 access units in order and acknowledges each decoded frame', async () => {
    vi.stubGlobal('WebSocket', SocketStub)
    const configured: unknown[] = [], chunks: { type: string }[] = []
    let output: ((frame: { displayWidth: number; displayHeight: number; close: () => void }) => void) | undefined
    class DecoderStub {
      state = 'unconfigured'
      constructor(init: { output: typeof output }) { output = init.output }
      configure(config: unknown) { configured.push(config); this.state = 'configured' }
      decode(chunk: { type: string }) { chunks.push(chunk); output?.({ displayWidth: 1, displayHeight: 1, close: vi.fn() }) }
      close() { this.state = 'closed' }
    }
    vi.stubGlobal('VideoDecoder', DecoderStub)
    vi.stubGlobal('EncodedVideoChunk', class { type: string; constructor(init: { type: string }) { this.type = init.type } })
    presenter.drawBitmap = vi.fn()
    const unit = (id: number, keyframe: boolean) => {
      const header = new TextEncoder().encode(JSON.stringify({ account_id: 'one', session_id: 'session', frame_id: id, width: 1, height: 1, keyframe, codec: 'avc1.640028' }))
      const bytes = new Uint8Array(header.length + 8)
      new DataView(bytes.buffer).setUint32(0, header.length)
      bytes.set(header, 4)
      return bytes.buffer
    }
    const stream = new FramebufferStream(document.createElement('canvas'), {
      url: 'ws://example.test/frames', accountId: 'one', encoding: 'h264', mode: 'frame', onContextLost: vi.fn(),
    }, vi.fn())
    stream.start()
    await vi.waitFor(() => expect(SocketStub.instances).toHaveLength(1))
    const socket = SocketStub.instances[0]
    socket.onopen?.()
    expect(JSON.parse(socket.sent[0])).toMatchObject({ encoding: 'h264', window: 4 })
    socket.onmessage?.({ data: unit(1, false) })
    await vi.waitFor(() => expect(socket.sent.filter(m => m.includes('ack'))).toHaveLength(1))
    expect(chunks).toHaveLength(0)
    socket.onmessage?.({ data: unit(2, true) })
    socket.onmessage?.({ data: unit(3, false) })
    await vi.waitFor(() => expect(presenter.drawBitmap).toHaveBeenCalledTimes(2))
    expect(configured).toEqual([{ codec: 'avc1.640028', optimizeForLatency: true, hardwareAcceleration: 'prefer-hardware' }])
    expect(chunks.map(chunk => chunk.type)).toEqual(['key', 'delta'])
    expect(socket.sent.filter(m => m.includes('ack'))).toHaveLength(3)
    stream.dispose()
  })
})
