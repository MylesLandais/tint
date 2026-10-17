import { parseFrameEnvelope, type FrameEncoding, type FrameMode } from './protocol'
import { rgbaPresenter, type Presenter } from './rgbaPresenter'

export type FrameDemand = 'selected' | 'preview' | 'hidden' | 'frozen' | 'historical'

export type FramebufferStreamOptions = {
  demand?: FrameDemand
  url: string
  accountId: string
  encoding: FrameEncoding
  mode: FrameMode
  forceWebGL?: boolean
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
  private demand: FrameDemand
  private demandGeneration = 0
  private lastPresented = 0
  private received = 0
  private presented = 0
  private ackTimer: ReturnType<typeof setTimeout> | undefined
  private status = ''
  private lastFrame = Date.now()
  private sessionId = ''
  private contextFailureReported = false
  private version = 0
  private started = false
  private disposed = false
  private scratch: OffscreenCanvas | HTMLCanvasElement | null = null
  private context: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null

  constructor(canvas: HTMLCanvasElement, options: FramebufferStreamOptions, onStatus: (status: string) => void) {
    this.canvas = canvas
    this.options = options
    this.onStatus = onStatus
    this.demand = options.demand ?? "selected"
    this.canvas.dataset.demand = this.demand
  }

  /** Changing viewer demand preserves the socket, process and presentation backend. */
  setDemand(demand: FrameDemand): void {
    if (this.demand === demand || this.disposed) return
    this.demand = demand; this.demandGeneration += 1
    this.canvas.dataset.demand = demand
    this.settings()
    if (this.paused()) this.publish(demand === 'frozen' || demand === 'historical' ? 'Preview frozen' : 'Preview hidden')
  }

  private paused(): boolean { return document.hidden || !['selected', 'preview'].includes(this.demand) }

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
      this.socket.send(JSON.stringify({ kind: this.options.mode, width: 1280, height: 720, paused: this.paused() }))
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
    if (this.ackTimer) clearTimeout(this.ackTimer)
    this.ackTimer = undefined
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
        if (!this.paused() && socket.readyState === WebSocket.OPEN && Date.now() - this.lastFrame > 5000) {
          this.publish('Frames are stale')
          socket.close()
        }
      }, 1000)
    } catch (cause) {
      this.publish(String(cause))
      this.closeConnection()
    }
  }

  private async receive(data: unknown, version: number): Promise<void> {
    if (this.disposed || version !== this.version || !this.presenter) return
    let bitmap: ImageBitmap | undefined
    const demandGeneration = this.demandGeneration
    try {
      if (!(data instanceof ArrayBuffer)) throw new Error('Invalid frame payload')
      const frame = parseFrameEnvelope(data, this.options.accountId, this.sessionId, this.options.encoding)
      this.sessionId = frame.sessionId
      this.lastFrame = Date.now()
      this.canvas.dataset.framesReceived = String(++this.received)
      if (this.paused() || (this.demand === 'preview' && Date.now() - this.lastPresented < 200)) return
      let pixels: Uint8ClampedArray
      if (this.options.encoding === 'png') {
        bitmap = await createImageBitmap(new Blob([data.slice(frame.payloadOffset)], { type: 'image/png' }))
        if (this.disposed || version !== this.version) return
        if (bitmap.width !== frame.width || bitmap.height !== frame.height) throw new Error('Frame image dimensions mismatch')
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
      } else {
        pixels = new Uint8ClampedArray(data, frame.payloadOffset)
      }
      this.lastFrame = Date.now()
      if (!this.paused() && demandGeneration === this.demandGeneration) {
        this.presenter.draw(pixels, frame.width, frame.height)
        this.lastPresented = Date.now()
        this.canvas.dataset.framesPresented = String(++this.presented)
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
        // The PNG gateway sends one frame per acknowledgement. Preview demand
        // therefore also bounds production, rather than only discarding pixels.
        if (this.demand === 'preview') {
          if (!this.ackTimer) this.ackTimer = setTimeout(() => {
            this.ackTimer = undefined
            if (!this.disposed && version === this.version && this.socket?.readyState === WebSocket.OPEN) this.socket.send(JSON.stringify({ type: 'ack' }))
          }, 200)
        } else this.socket.send(JSON.stringify({ type: 'ack' }))
      }
    }
  }
}
