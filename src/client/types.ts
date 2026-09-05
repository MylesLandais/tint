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

export type TintClientSnapshot = {
  status: TintClientStatus
  readyCapabilities: readonly string[]
  failedCapabilities: readonly string[]
  problem: TintProblem | null
}
