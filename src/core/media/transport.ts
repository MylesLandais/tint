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
  onError?: () => void
}

const playbackGroups = new Map<string, Set<MediaTransport>>()

/** Owns HTMLMediaElement behavior without owning any rendering framework. */
export class MediaTransport {
  private element?: HTMLMediaElement
  private attachment = 0
  private operation = 0
  private playbackGroup?: string
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
    ++this.operation
    this.update({ playing: false, currentTime: 0, duration: durationHint, buffering: false, failed: false })
  }

  attach(element: HTMLMediaElement): () => void {
    this.detach()
    this.element = element
    const attachment = this.attachment
    this.joinGroup()
    const current = () => this.element === element && this.attachment === attachment
    const listen = (name: keyof HTMLMediaElementEventMap, listener: EventListener) => {
      const owned: EventListener = event => { if (current()) listener(event) }
      element.addEventListener(name, owned)
      this.events.push([name, owned])
    }
    const readDuration = () => {
      if (Number.isFinite(element.duration)) this.update({ duration: element.duration })
    }
    listen('loadedmetadata', readDuration)
    listen('durationchange', readDuration)
    listen('timeupdate', () => this.update({ currentTime: element.currentTime }))
    listen('play', () => { this.claimGroup(); this.update({ playing: true, buffering: false }); this.callbacks.onPlay?.() })
    listen('pause', () => { this.update({ playing: false, buffering: false }); this.callbacks.onPause?.() })
    listen('ended', () => { this.update({ playing: false, currentTime: 0 }); this.callbacks.onEnded?.() })
    listen('waiting', () => this.update({ buffering: true }))
    listen('playing', () => this.update({ buffering: false }))
    listen('canplay', () => this.update({ buffering: false }))
    listen('error', () => this.fail())
    return () => { if (current()) this.detach() }
  }

  detach(): void {
    const element = this.element
    this.leaveGroup()
    ++this.attachment; ++this.operation
    if (element) for (const [name, listener] of this.events) element.removeEventListener(name, listener)
    this.events = []
    this.element = undefined
    if (element && !element.paused) { try { element.pause() } catch { /* Already detached; no successor callback. */ } }
  }

  setPlaybackGroup(group?: string): void {
    if (this.playbackGroup === (group || undefined)) return
    this.leaveGroup()
    this.playbackGroup = group || undefined
    this.joinGroup()
    if (this.element && !this.element.paused) this.claimGroup()
  }

  private joinGroup(): void {
    if (!this.playbackGroup || !this.element) return
    const peers = playbackGroups.get(this.playbackGroup) ?? new Set<MediaTransport>()
    peers.add(this); playbackGroups.set(this.playbackGroup, peers)
  }
  private leaveGroup(): void {
    if (!this.playbackGroup) return
    const peers = playbackGroups.get(this.playbackGroup)
    peers?.delete(this)
    if (!peers?.size) playbackGroups.delete(this.playbackGroup)
  }
  private claimGroup(): void {
    if (!this.playbackGroup) return
    for (const peer of [...(playbackGroups.get(this.playbackGroup) ?? [])]) if (peer !== this) peer.pause()
  }
  private fail(): void {
    if (!this.element || this.state.failed) return
    this.update({ buffering: false, failed: true, playing: false })
    this.callbacks.onError?.()
  }

  play(): void {
    const element = this.element, attachment = this.attachment, operation = ++this.operation
    if (!element || this.state.failed) return
    const current = () => this.element === element && attachment === this.attachment && operation === this.operation
    try {
      void Promise.resolve(element.play()).catch((error: unknown) => {
        if (!current() || (error instanceof DOMException && error.name === 'AbortError')) return
        this.fail()
      })
    } catch { if (current()) this.fail() }
  }

  playFromStart(): void {
    if (!this.element || this.state.failed) return
    this.element.currentTime = 0
    this.update({ currentTime: 0 })
    this.play()
  }

  pause(): void { ++this.operation; if (this.element && !this.element.paused) this.element.pause() }

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

  /** Absolute host seek; native media may retain the start position until metadata arrives. */
  seekTo(positionSeconds: number): boolean {
    if (!this.element || this.state.failed || !Number.isFinite(positionSeconds) || positionSeconds < 0) return false
    const position = this.state.duration > 0 ? Math.min(positionSeconds, this.state.duration) : positionSeconds
    try { this.element.currentTime = position; this.update({ currentTime: position }); return true }
    catch { this.fail(); return false }
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
