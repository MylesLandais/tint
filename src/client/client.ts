import type { AuthClient } from '../auth/client'
import { TintCapabilityError, normalizeTintProblem } from './errors'
import type {
  NavigationAdapter,
  PlaybackAdapter,
  RealtimeAdapter,
  RequestAdapter,
  StorageAdapter,
  TintCapability,
  TintClientSnapshot,
  UploadAdapter,
} from './types'

export type TintClientOptions = {
  request: RequestAdapter
  auth?: AuthClient
  navigation?: NavigationAdapter
  realtime?: RealtimeAdapter
  uploads?: UploadAdapter
  storage?: StorageAdapter
  playback?: PlaybackAdapter
}

type CapabilityName = 'auth' | 'navigation' | 'realtime' | 'uploads' | 'storage' | 'playback'

const SERVER_SNAPSHOT: TintClientSnapshot = Object.freeze({
  status: 'idle',
  readyCapabilities: Object.freeze([]),
  failedCapabilities: Object.freeze([]),
  problem: null,
})

export class TintClient {
  readonly request: RequestAdapter
  readonly auth?: AuthClient
  readonly navigation?: NavigationAdapter
  readonly realtime?: RealtimeAdapter
  readonly uploads?: UploadAdapter
  readonly storage?: StorageAdapter
  readonly playback?: PlaybackAdapter

  private readonly listeners = new Set<() => void>()
  private leases = 0
  private started = false
  private generation = 0
  private startPromise: Promise<void> | null = null
  private snapshot: TintClientSnapshot = SERVER_SNAPSHOT

  constructor(options: TintClientOptions) {
    this.request = options.request
    this.auth = options.auth
    this.navigation = options.navigation
    this.realtime = options.realtime
    this.uploads = options.uploads
    this.storage = options.storage
    this.playback = options.playback
  }

  readonly getSnapshot = (): TintClientSnapshot => this.snapshot
  readonly getServerSnapshot = (): TintClientSnapshot => SERVER_SNAPSHOT
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  start(): Promise<void> {
    this.leases += 1
    this.generation += 1
    if (this.started) return this.startPromise ?? Promise.resolve()
    this.started = true
    this.startPromise = this.startCapabilities()
    return this.startPromise
  }

  stop(): void {
    this.leases = Math.max(0, this.leases - 1)
    const generation = ++this.generation
    queueMicrotask(() => {
      if (this.leases !== 0 || generation !== this.generation || !this.started) return
      void this.finalizeStop(generation)
    })
  }

  require<K extends CapabilityName>(name: K): NonNullable<TintClient[K]> {
    const capability = this[name]
    if (!capability) throw new TintCapabilityError(name)
    return capability as NonNullable<TintClient[K]>
  }

  private entries(): Array<[CapabilityName, TintCapability]> {
    const values: Array<[CapabilityName, TintCapability | undefined]> = [
      ['auth', this.auth],
      ['navigation', this.navigation],
      ['realtime', this.realtime],
      ['uploads', this.uploads],
      ['storage', this.storage],
      ['playback', this.playback],
    ]
    return values.filter((entry): entry is [CapabilityName, TintCapability] => Boolean(entry[1]))
  }

  private async startCapabilities(): Promise<void> {
    this.patch({ status: 'starting', problem: null, readyCapabilities: [], failedCapabilities: [] })
    const ready: string[] = []
    const failed: string[] = []
    let firstProblem: TintClientSnapshot['problem'] = null
    for (const [name, capability] of this.entries()) {
      try {
        if (name === 'auth') await this.auth?.initialize()
        else await capability.start?.()
        ready.push(name)
      } catch (cause) {
        failed.push(name)
        firstProblem ??= normalizeTintProblem(cause)
      }
    }
    this.patch({
      status: failed.length === 0 ? 'ready' : ready.length === 0 ? 'error' : 'degraded',
      readyCapabilities: ready,
      failedCapabilities: failed,
      problem: firstProblem,
    })
  }

  private async stopCapabilities(): Promise<void> {
    for (const [, capability] of this.entries().reverse()) await capability.stop?.()
    this.patch({ status: 'stopped', readyCapabilities: [], failedCapabilities: [], problem: null })
  }

  private async finalizeStop(generation: number): Promise<void> {
    await this.startPromise?.catch(() => undefined)
    if (this.leases !== 0 || generation !== this.generation || !this.started) return
    this.started = false
    this.startPromise = null
    await this.stopCapabilities()
  }

  private patch(update: Partial<TintClientSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...update }
    for (const listener of this.listeners) listener()
  }
}

export function createTintClient(options: TintClientOptions): TintClient {
  return new TintClient(options)
}
