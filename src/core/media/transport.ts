import { clampPercent } from './model'

export type MediaTransportSnapshot = {
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  buffering: boolean
  failed: boolean
}

export type MediaTransportCallbacks = {
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

/** Owns HTMLMediaElement behavior without owning any rendering framework. */
export class MediaTransport {
  private element?: HTMLMediaElement
  private listeners = new Set<(snapshot: MediaTransportSnapshot) => void>()
  private callbacks: MediaTransportCallbacks = {}
  private events: [keyof HTMLMediaElementEventMap, EventListener][] = []
  private state: MediaTransportSnapshot = {
    playing: false, currentTime: 0, duration: 0, volume: 1,
    muted: false, buffering: false, failed: false,
  }

  get snapshot(): MediaTransportSnapshot { return this.state }

  subscribe(listener: (snapshot: MediaTransportSnapshot) => void): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  setCallbacks(callbacks: MediaTransportCallbacks): void { this.callbacks = callbacks }

  private update(patch: Partial<MediaTransportSnapshot>): void {
    this.state = { ...this.state, ...patch }
    for (const listener of this.listeners) listener(this.state)
  }

  reset(durationHint = 0): void {
    this.update({ playing: false, currentTime: 0, duration: durationHint, buffering: false, failed: false })
  }

  attach(element: HTMLMediaElement): () => void {
    this.detach()
    this.element = element
    const listen = (name: keyof HTMLMediaElementEventMap, listener: EventListener) => {
      element.addEventListener(name, listener)
      this.events.push([name, listener])
    }
    const readDuration = () => {
      if (Number.isFinite(element.duration)) this.update({ duration: element.duration })
    }
    listen('loadedmetadata', readDuration)
    listen('durationchange', readDuration)
    listen('timeupdate', () => this.update({ currentTime: element.currentTime }))
    listen('play', () => { this.update({ playing: true, buffering: false }); this.callbacks.onPlay?.() })
    listen('pause', () => { this.update({ playing: false, buffering: false }); this.callbacks.onPause?.() })
    listen('ended', () => { this.update({ playing: false, currentTime: 0 }); this.callbacks.onEnded?.() })
    listen('waiting', () => this.update({ buffering: true }))
    listen('playing', () => this.update({ buffering: false }))
    listen('canplay', () => this.update({ buffering: false }))
    listen('error', () => this.update({ buffering: false, failed: true, playing: false }))
    return () => this.detach()
  }

  detach(): void {
    if (this.element) for (const [name, listener] of this.events) this.element.removeEventListener(name, listener)
    this.events = []
    this.element = undefined
  }

  play(): void {
    if (!this.element || this.state.failed) return
    try {
      void Promise.resolve(this.element.play()).catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        this.update({ buffering: false, failed: true, playing: false })
      })
    } catch {
      this.update({ buffering: false, failed: true, playing: false })
    }
  }

  playFromStart(): void {
    if (!this.element || this.state.failed) return
    this.element.currentTime = 0
    this.update({ currentTime: 0 })
    this.play()
  }

  pause(): void { this.element?.pause() }

  toggle(): void {
    if (!this.element || this.state.failed) return
    if (this.element.paused) this.play()
    else this.pause()
  }

  seek(percentage: number): void {
    if (!this.element || !Number.isFinite(this.state.duration) || this.state.duration <= 0) return
    const next = clampPercent(percentage) / 100 * this.state.duration
    this.element.currentTime = next
    this.update({ currentTime: next })
  }

  changeVolume(percentage: number): void {
    const level = clampPercent(percentage) / 100
    if (this.element) { this.element.volume = level; this.element.muted = level === 0 }
    this.update({ volume: level, muted: level === 0 })
  }

  toggleMute(): void {
    const muted = !this.state.muted
    if (this.element) this.element.muted = muted
    this.update({ muted })
  }
}
