import { parseFrameEnvelope, type FrameEncoding, type FrameMode } from './protocol'
import { rgbaPresenter, type Presenter } from './rgbaPresenter'

export type FramebufferStreamOptions = {
  url: string
  accountId: string
  encoding: FrameEncoding
  mode: FrameMode
  forceWebGL?: boolean
  /** Frames per second this view wants; the server paces delivery to it. */
  fps?: number
  /** Largest image this view can show; the server sizes previews down before encoding. */
  maxWidth?: number
  maxHeight?: number
  onContextLost: () => void
}

/** Account-bound browser stream. UI frameworks only mount and dispose it. */
export class FramebufferStream {
  private readonly canvas: HTMLCanvasElement
  private readonly options: FramebufferStreamOptions
  private readonly onStatus: (status: string) => void
  private socket: WebSocket | null = null
  private presenter: Presenter | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined
  private watchdog: ReturnType<typeof setInterval> | undefined
  private status = ''
  private lastFrame = Date.now()
  private sessionId = ''
  private contextFailureReported = false
  private version = 0
  private started = false
  private disposed = false
  /** Arrival order of frames, so a decode that finishes after a newer frame was drawn is dropped. */
  private arrivals = 0
  private drawnArrival = 0
  /**
   * Frames the server may keep in flight. Two overlaps decoding with delivery (measured
   * 54 vs 46 fps on an idle host); a CPU-starved browser decodes slower with two, so the
   * stream drops to one while its average decode is far beyond the frame period.
   */
  private window = 2
  private decodeAverage = 0
  private scratch: OffscreenCanvas | HTMLCanvasElement | null = null
  private context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null

  constructor(canvas: HTMLCanvasElement, options: FramebufferStreamOptions, onStatus: (status: string) => void) {
    this.canvas = canvas
    this.options = options
    this.onStatus = onStatus
  }

  start(): void {
    if (this.started || this.disposed) return
    this.started = true
    this.publish('Connecting')
    document.addEventListener('visibilitychange', this.settings)
    this.canvas.addEventListener('webglcontextlost', this.contextLost)
    this.canvas.addEventListener('framecontextlost', this.contextLost)
    void this.connect()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.version += 1
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    document.removeEventListener('visibilitychange', this.settings)
    this.canvas.removeEventListener('webglcontextlost', this.contextLost)
    this.canvas.removeEventListener('framecontextlost', this.contextLost)
    this.closeConnection()
  }

  private publish(status: string): void {
    if (status === this.status) return
    this.status = status
    this.onStatus(status)
  }

  private readonly settings = () => {
    this.lastFrame = Date.now()
    if (this.options.encoding === 'png' && this.socket?.readyState === WebSocket.OPEN) {
      const { fps = 30, maxWidth = 1280, maxHeight = 720 } = this.options
      this.socket.send(JSON.stringify({ kind: this.options.mode, width: maxWidth, height: maxHeight, fps, window: this.window, paused: document.hidden }))
    }
  }

  private readonly contextLost = (event: Event) => {
    event.preventDefault()
    if (this.disposed || this.contextFailureReported) return
    this.contextFailureReported = true
    this.publish('Rendering context lost')
    this.closeConnection()
    this.options.onContextLost()
  }

  private closeConnection(): void {
    if (this.watchdog) clearInterval(this.watchdog)
    this.watchdog = undefined
    if (this.socket) {
      this.socket.onopen = null
      this.socket.onmessage = null
      this.socket.onclose = null
      this.socket.onerror = null
      this.socket.close()
      this.socket = null
    }
    this.presenter?.destroy()
    this.presenter = null
  }

  private scheduleReconnect(): void {
    if (this.disposed || this.reconnectTimer) return
    this.publish('Reconnecting')
    this.version += 1
    this.closeConnection()
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined
      if (this.disposed) return
      this.sessionId = ''
      void this.connect()
    }, 1000)
  }

  private async connect(): Promise<void> {
    const version = ++this.version
    let presenter: Presenter
    try {
      presenter = await rgbaPresenter(this.canvas, this.options.forceWebGL)
    } catch (cause) {
      if (!this.disposed && version === this.version) this.publish(String(cause))
      return
    }
    if (this.disposed || version !== this.version) { presenter.destroy(); return }
    this.presenter = presenter
    try {
      const socket = new WebSocket(this.options.url)
      socket.binaryType = 'arraybuffer'
      this.socket = socket
      socket.onopen = this.settings
      socket.onmessage = (event) => { void this.receive(event.data, version) }
      socket.onclose = () => this.scheduleReconnect()
      this.watchdog = setInterval(() => {
        if (!document.hidden && socket.readyState === WebSocket.OPEN && Date.now() - this.lastFrame > 5000) {
          this.publish('Frames are stale')
          socket.close()
        }
      }, 1000)
    } catch (cause) {
      this.publish(String(cause))
      this.closeConnection()
    }
  }

  /** Hold two frames in flight while decoding keeps up with the frame period; otherwise one. */
  private adaptWindow(decodeMs: number): void {
    this.decodeAverage = this.decodeAverage ? this.decodeAverage * 0.9 + decodeMs * 0.1 : decodeMs
    const period = 1000 / (this.options.fps ?? 30)
    // Overlapping decodes each take longer, so starvation is a decode far beyond the period
    // (59 ms at 60 fps on a saturated host), not one slightly above it (about 18 ms when idle).
    const next = this.decodeAverage > period * 2.5 ? 1 : this.decodeAverage < period ? 2 : this.window
    if (next === this.window) return
    this.window = next
    this.settings()
  }

  private async receive(data: unknown, version: number): Promise<void> {
    if (this.disposed || version !== this.version || !this.presenter) return
    const arrival = ++this.arrivals
    let bitmap: ImageBitmap | undefined
    try {
      if (!(data instanceof ArrayBuffer)) throw new Error('Invalid frame payload')
      const frame = parseFrameEnvelope(data, this.options.accountId, this.sessionId, this.options.encoding)
      this.sessionId = frame.sessionId
      let pixels: Uint8ClampedArray | undefined
      if (this.options.encoding === 'png') {
        // A hidden page acknowledges without decoding; it is paused and repaints when shown.
        if (document.hidden) { this.lastFrame = Date.now(); return }
        const decodeStarted = performance.now()
        bitmap = await createImageBitmap(new Blob([data.slice(frame.payloadOffset)], { type: 'image/png' }),
          { premultiplyAlpha: 'none', colorSpaceConversion: 'none', imageOrientation: 'none' })
        this.adaptWindow(performance.now() - decodeStarted)
        if (this.disposed || version !== this.version || !this.presenter) return
        if (bitmap.width !== frame.width || bitmap.height !== frame.height) throw new Error('Frame image dimensions mismatch')
        if (!this.presenter.drawBitmap) {
          // Custom presenters without bitmap upload still receive RGBA bytes.
          if (!this.scratch) {
            this.scratch = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(frame.width, frame.height) : document.createElement('canvas')
            this.context = this.scratch.getContext('2d') as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null
          }
          if (!this.context) throw new Error('Canvas 2D is unavailable')
          if (this.scratch.width !== frame.width || this.scratch.height !== frame.height) {
            this.scratch.width = frame.width
            this.scratch.height = frame.height
          }
          this.context.clearRect(0, 0, frame.width, frame.height)
          this.context.drawImage(bitmap, 0, 0)
          pixels = this.context.getImageData(0, 0, frame.width, frame.height).data
        }
      } else {
        pixels = new Uint8ClampedArray(data, frame.payloadOffset)
      }
      this.lastFrame = Date.now()
      if (arrival < this.drawnArrival) return
      this.drawnArrival = arrival
      if (!document.hidden) {
        if (pixels) this.presenter.draw(pixels, frame.width, frame.height)
        else this.presenter.drawBitmap!(bitmap!)
        this.canvas.dataset.frameId = frame.frameId
        this.canvas.dataset.sessionId = frame.sessionId
        this.canvas.dataset.backend = this.presenter.backend
        this.publish('Live')
      }
    } catch (cause) {
      if (!this.disposed && version === this.version) {
        this.publish(String(cause))
        this.socket?.close()
      }
    } finally {
      bitmap?.close()
      if (!this.disposed && version === this.version && this.options.encoding === 'png' && this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'ack' }))
      }
    }
  }
}
