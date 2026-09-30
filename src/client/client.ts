import type { AuthClient } from '../auth/client'
import { TintCapabilityError, normalizeTintProblem } from './errors'
import type {
  CapabilityStatus,
  NavigationAdapter,
  OperationAdapter,
  PlaybackAdapter,
  RealtimeAdapter,
  RequestAdapter,
  StorageAdapter,
  TintCapability,
  TintClientSnapshot,
  TintProblem,
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
  operations?: OperationAdapter
  /**
   * Host-defined capabilities, started and stopped alongside the built-ins.
   *
   * The named fields above are the ones tint itself has hooks for. They are not
   * meant to be the complete list of things a host owns: a Discord bot panel
   * has a guild player, a CMS has a draft store, and neither is `storage`.
   * Without somewhere to put those, hosts either mislabel them as a built-in or
   * keep them outside the client entirely and lose the shared lifecycle — which
   * is the boundary this layer exists to hold.
   *
   * Keys must not collide with a built-in name.
   */
  capabilities?: Readonly<Record<string, TintCapability>>
}

const BUILTIN_NAMES = ['auth', 'navigation', 'realtime', 'uploads', 'storage', 'playback', 'operations'] as const

type BuiltinName = (typeof BUILTIN_NAMES)[number]

const SERVER_SNAPSHOT: TintClientSnapshot = Object.freeze({
  status: 'idle',
  capabilities: Object.freeze({}),
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
  readonly operations?: OperationAdapter
  readonly capabilities: Readonly<Record<string, TintCapability>>

  private readonly listeners = new Set<() => void>()
  private leases = 0
  private started = false
  /**
   * Invalidates a deferred stop.
   *
   * `stop()` defers its teardown by a microtask so that a StrictMode effect
   * replay — unmount then immediate remount — does not tear the capabilities
   * down and build them straight back up. Both `start()` and `stop()` bump this
   * token, so a deferred stop that finds the token changed knows a newer call
   * has superseded it and does nothing.
   */
  private stopToken = 0
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
    this.operations = options.operations
    const extras = options.capabilities ?? {}
    for (const name of Object.keys(extras)) {
      if ((BUILTIN_NAMES as readonly string[]).includes(name)) {
        throw new Error(`“${name}” is a built-in Tint capability; pass it as its own option instead.`)
      }
    }
    this.capabilities = extras
  }

  readonly getSnapshot = (): TintClientSnapshot => this.snapshot
  readonly getServerSnapshot = (): TintClientSnapshot => SERVER_SNAPSHOT
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Starts every configured capability, reference-counted so nested providers
   * share one lifecycle.
   *
   * The returned promise resolves once startup has been *attempted* — it does
   * not reject when a capability fails. A failed optional capability is a
   * degraded client, not a dead one, and the snapshot is where that is
   * reported (`status`, `capabilities[name].problem`). Callers that need to
   * branch on failure read the snapshot after awaiting; they should not
   * wrap this in a `try`.
   */
  start(): Promise<void> {
    this.leases += 1
    this.stopToken += 1
    if (this.started) return this.startPromise ?? Promise.resolve()
    this.started = true
    this.startPromise = this.startCapabilities()
    return this.startPromise
  }

  stop(): void {
    this.leases = Math.max(0, this.leases - 1)
    const token = ++this.stopToken
    queueMicrotask(() => {
      if (this.leases !== 0 || token !== this.stopToken || !this.started) return
      void this.finalizeStop(token)
    })
  }

  require<K extends BuiltinName>(name: K): NonNullable<TintClient[K]>
  require(name: string): TintCapability
  require(name: string): unknown {
    const capability = (BUILTIN_NAMES as readonly string[]).includes(name)
      ? (this as unknown as Record<string, unknown>)[name]
      : this.capabilities[name]
    if (!capability) throw new TintCapabilityError(name)
    return capability
  }

  /**
   * Restarts a single capability that failed, leaving the others alone.
   *
   * Resolves to the capability's status afterwards rather than throwing, for
   * the same reason `start()` does not reject.
   */
  async restart(name: string): Promise<CapabilityStatus> {
    const capability = this.require(name) as TintCapability
    this.patchCapability(name, { state: 'starting' })
    try {
      await capability.stop?.()
    } catch {
      // A capability that cannot stop cleanly should not block the retry.
    }
    const status = await this.startCapability(name, capability)
    this.patchCapability(name, status)
    this.reconcileStatus()
    return status
  }

  private entries(): Array<[string, TintCapability]> {
    const builtins: Array<[string, TintCapability | undefined]> = [
      ['auth', this.auth as TintCapability | undefined],
      ['navigation', this.navigation],
      ['realtime', this.realtime],
      ['uploads', this.uploads],
      ['storage', this.storage],
      ['playback', this.playback],
      ['operations', this.operations],
    ]
    return [...builtins, ...Object.entries(this.capabilities)].filter(
      (entry): entry is [string, TintCapability] => Boolean(entry[1]),
    )
  }

  private async startCapability(name: string, capability: TintCapability): Promise<CapabilityStatus> {
    try {
      if (name === 'auth') await this.auth?.initialize()
      else await capability.start?.()
      return { state: 'ready' }
    } catch (cause) {
      return { state: 'failed', problem: normalizeTintProblem(cause) }
    }
  }

  private async startCapabilities(): Promise<void> {
    const entries = this.entries()
    this.patch({
      status: 'starting',
      problem: null,
      capabilities: Object.fromEntries(entries.map(([name]) => [name, { state: 'starting' } as CapabilityStatus])),
      readyCapabilities: [],
      failedCapabilities: [],
    })

    // Concurrent, not serial: a capability that takes a second to open a socket
    // must not hold up the five that are ready immediately.
    const results = await Promise.all(entries.map(([name, capability]) => this.startCapability(name, capability)))
    const capabilities: Record<string, CapabilityStatus> = {}
    entries.forEach(([name], index) => {
      capabilities[name] = results[index]!
    })
    this.patch({ capabilities })
    this.reconcileStatus()
  }

  private async stopCapabilities(): Promise<void> {
    for (const [, capability] of this.entries().reverse()) await capability.stop?.()
    this.patch({
      status: 'stopped',
      capabilities: Object.fromEntries(this.entries().map(([name]) => [name, { state: 'stopped' } as CapabilityStatus])),
      readyCapabilities: [],
      failedCapabilities: [],
      problem: null,
    })
  }

  private async finalizeStop(token: number): Promise<void> {
    await this.startPromise?.catch(() => undefined)
    if (this.leases !== 0 || token !== this.stopToken || !this.started) return
    this.started = false
    this.startPromise = null
    await this.stopCapabilities()
  }

  /** Derives the client-wide status and the two convenience lists from `capabilities`. */
  private reconcileStatus(): void {
    const entries = Object.entries(this.snapshot.capabilities)
    const ready = entries.filter(([, status]) => status.state === 'ready').map(([name]) => name)
    const failed = entries.filter(([, status]) => status.state === 'failed').map(([name]) => name)
    let problem: TintProblem | null = null
    for (const name of failed) {
      problem = this.snapshot.capabilities[name]?.problem ?? problem
      if (problem) break
    }
    this.patch({
      status: failed.length === 0 ? 'ready' : ready.length === 0 ? 'error' : 'degraded',
      readyCapabilities: ready,
      failedCapabilities: failed,
      problem,
    })
  }

  private patchCapability(name: string, status: CapabilityStatus): void {
    this.patch({ capabilities: { ...this.snapshot.capabilities, [name]: status } })
  }

  private patch(update: Partial<TintClientSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...update }
    for (const listener of this.listeners) listener()
  }
}

export function createTintClient(options: TintClientOptions): TintClient {
  return new TintClient(options)
}
