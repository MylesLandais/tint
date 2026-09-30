export type TintClientStatus = 'idle' | 'starting' | 'ready' | 'degraded' | 'stopped' | 'error'

export type TintProblem = {
  type?: string
  title: string
  status?: number
  detail?: string
  code: string
  requestId?: string
  retryAfterMs?: number
  metadata?: Readonly<Record<string, unknown>>
}

export type OperationOptions = {
  signal?: AbortSignal
  requestId?: string
  deadlineMs?: number
}

export type TintResponseType = 'json' | 'text' | 'blob' | 'arrayBuffer'

export type TintRequest<TBody = unknown> = OperationOptions & {
  method: string
  url: string
  headers?: Readonly<Record<string, string>>
  body?: TBody
  responseType?: TintResponseType
}

export type TintResponse<T = unknown> = {
  status: number
  headers: Readonly<Record<string, string>>
  data: T
  requestId?: string
}

export type RequestAdapter = {
  send<T = unknown, TBody = unknown>(request: TintRequest<TBody>): Promise<TintResponse<T>>
}

export type ExternalStore<TSnapshot> = {
  getSnapshot(): TSnapshot
  getServerSnapshot?: () => TSnapshot
  subscribe(listener: () => void): () => void
}

export type TintCapability<TSnapshot = unknown> = Partial<ExternalStore<TSnapshot>> & {
  start?(): void | Promise<void>
  stop?(): void | Promise<void>
}

export type ConnectionState = 'idle' | 'connecting' | 'online' | 'reconnecting' | 'offline' | 'error'

export type ConnectionSnapshot = {
  state: ConnectionState
  attempt: number
  lastConnectedAt?: string
  problem?: TintProblem
}

export type RealtimeEvent<T = unknown> = {
  id?: string
  type: string
  data: T
  receivedAt: string
}

export type RealtimeSubscription = {
  close(): void
}

export type RealtimeAdapter = TintCapability<ConnectionSnapshot> & {
  subscribeTo<T = unknown>(
    channel: string,
    listener: (event: RealtimeEvent<T>) => void,
    options?: OperationOptions,
  ): RealtimeSubscription
}

export type UploadStatus = 'queued' | 'uploading' | 'complete' | 'error' | 'cancelled'

export type UploadTask = {
  id: string
  file: File
  status: UploadStatus
  progress: number
  result?: unknown
  problem?: TintProblem
}

export type UploadSnapshot = { tasks: readonly UploadTask[] }

export type UploadAdapter = TintCapability<UploadSnapshot> & {
  enqueue(files: readonly File[], options?: OperationOptions): readonly string[]
  cancel(taskId: string): void
  retry(taskId: string): void
}

export type StorageAdapter = TintCapability & {
  get<T>(namespace: string, key: string, options?: OperationOptions): Promise<T | undefined>
  set<T>(namespace: string, key: string, value: T, options?: OperationOptions): Promise<void>
  delete(namespace: string, key: string, options?: OperationOptions): Promise<void>
}

export type NavigationSnapshot = {
  pathname: string
  search?: string
  hash?: string
}

export type NavigationAdapter = TintCapability<NavigationSnapshot> & {
  href(to: string): string
  navigate(to: string, options?: { replace?: boolean }): void | Promise<void>
  isActive(to: string, snapshot?: NavigationSnapshot): boolean
}

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'ended'

/**
 * Serializable queue metadata. Media source URLs are deliberately absent: a
 * browser-backed playback adapter can remember what the user was viewing
 * without copying signed streams or credentials into localStorage.
 */
export type PlaybackItem = {
  id: string
  title: string
  artist?: string
  artwork?: string
  href?: string
  durationSeconds?: number
}

export type PlaybackSnapshot = {
  queue: readonly PlaybackItem[]
  currentItemId: string | null
  status: PlaybackStatus
  positionSeconds: number
  updatedAt: string | null
}

export type PlaybackSelectionOptions = {
  status?: PlaybackStatus
  positionSeconds?: number
}

export type PlaybackAdapter = TintCapability<PlaybackSnapshot> & {
  replaceQueue(items: readonly PlaybackItem[], currentItemId?: string | null): void
  select(itemId: string, options?: PlaybackSelectionOptions): void
  setStatus(status: PlaybackStatus): void
  setPosition(positionSeconds: number): void
  clear(): void
}

/**
 * A command that the host accepts now and completes later.
 *
 * This is deliberately not `RequestAdapter.send`. A request is one round trip:
 * the promise settles when the response arrives, and the response *is* the
 * result. Plenty of hosts do not work that way — they answer a mutation with
 * `202 Accepted` and an identifier, and the caller learns the outcome from a
 * later poll or push. Modelling that as a request forces every such host to
 * either lie (resolve early, so the UI re-enables a button before the work is
 * done) or hide the job loop in application code, which is where the
 * boundary erodes.
 *
 * It is also not `UploadAdapter`. Uploads carry `File`s and report byte
 * progress; operations carry commands and report a coarse state plus a
 * human-readable message. They look similar and mean different things.
 */
export type TintOperationState = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled'

export type TintOperation<TResult = unknown> = {
  id: string
  /** The command name the host was asked to run, echoed back for display. */
  name: string
  state: TintOperationState
  /** Host-supplied progress text. Safe to announce through `aria-live`. */
  message?: string
  result?: TResult
  problem?: TintProblem
  createdAt: string
  settledAt?: string
}

/**
 * The submission. `idempotencyKey` is the caller's guard against a double
 * submit: an adapter that has already seen the key must return the existing
 * operation rather than starting a second one.
 */
export type TintCommand<TInput = unknown> = OperationOptions & {
  name: string
  input?: TInput
  idempotencyKey?: string
}

/**
 * The handle. `settled` resolves — it does not reject — when the operation
 * leaves the pending states, because `failed` is an outcome the UI renders,
 * not an exception it unwinds through. Adapters reject `settled` only when the
 * operation could not be *tracked* at all.
 */
export type TintOperationHandle<TResult = unknown> = {
  id: string
  settled: Promise<TintOperation<TResult>>
  cancel(): void
}

export type OperationSnapshot = {
  operations: readonly TintOperation[]
}

/**
 * Unlike the other capabilities, the external-store members are required: an
 * operation adapter that cannot be observed is just a function call.
 */
export type OperationAdapter = TintCapability<OperationSnapshot> &
  ExternalStore<OperationSnapshot> & {
    submit<TResult = unknown, TInput = unknown>(command: TintCommand<TInput>): TintOperationHandle<TResult>
    cancel(operationId: string): void
    /** Drop settled operations from the snapshot. Pending ones are left alone. */
    clearSettled(): void
  }

export type CapabilityState = 'idle' | 'starting' | 'ready' | 'failed' | 'stopped'

export type CapabilityStatus = {
  state: CapabilityState
  problem?: TintProblem
}

export type TintClientSnapshot = {
  status: TintClientStatus
  /**
   * Per-capability detail, keyed by capability name. `readyCapabilities` and
   * `failedCapabilities` are derived from this and kept because they read well
   * at a glance; this is the field to consult when you need to know *which*
   * capability failed and *why*, or to drive a per-capability retry.
   */
  capabilities: Readonly<Record<string, CapabilityStatus>>
  readyCapabilities: readonly string[]
  failedCapabilities: readonly string[]
  problem: TintProblem | null
}
