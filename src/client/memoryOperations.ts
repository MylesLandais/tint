import { TintAbortError, normalizeTintProblem } from './errors'
import type {
  OperationAdapter,
  OperationSnapshot,
  TintCommand,
  TintOperation,
  TintOperationHandle,
} from './types'

/**
 * What the host does when a command is submitted.
 *
 * `report` publishes progress text into the operation snapshot without
 * settling it — this is where a host echoes the "Waiting to apply your
 * change…" style message that a job-queue backend hands back. `signal` aborts
 * when the operation is cancelled.
 */
export type OperationContext = {
  signal: AbortSignal
  report(message: string): void
}

/**
 * Returns `unknown` deliberately. The runner knows which command names produce
 * which results; the client does not, and cannot promise the caller's chosen
 * `TResult` on the runner's behalf. `submit<TResult>()` is where the host
 * asserts that mapping, at the one call site that knows the command.
 */
export type OperationRunner = (command: TintCommand, context: OperationContext) => Promise<unknown>

export type MemoryOperationAdapterOptions = {
  run: OperationRunner
  /** Injectable clock, so tests and demos get deterministic timestamps. */
  now?: () => Date
  createId?: () => string
}

let fallbackId = 0

function defaultId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  fallbackId += 1
  return `operation-${fallbackId}`
}

/**
 * An in-memory `OperationAdapter`: the reference implementation of the
 * accepted-now/completes-later seam, and the one demos and tests drive.
 *
 * Production hosts replace `run` with a real submit-and-poll loop; everything
 * else here — the snapshot, the idempotency guard, the settle promise — is the
 * same work every such host would otherwise write again.
 */
export function createMemoryOperationAdapter(options: MemoryOperationAdapterOptions): OperationAdapter {
  // Settled operations are never evicted automatically: eviction timing is a
  // host policy, and having a row vanish mid-render is worse than a list that
  // grows until `clearSettled()`.
  const now = options.now ?? (() => new Date())
  const createId = options.createId ?? defaultId
  const listeners = new Set<() => void>()
  const controllers = new Map<string, AbortController>()
  const byKey = new Map<string, TintOperationHandle<never>>()
  let operations: readonly TintOperation[] = []
  let snapshot: OperationSnapshot = { operations }

  function publish(): void {
    snapshot = { operations }
    for (const listener of listeners) listener()
  }

  function patch(id: string, update: Partial<TintOperation>): TintOperation | undefined {
    let next: TintOperation | undefined
    operations = operations.map((operation) => {
      if (operation.id !== id) return operation
      next = { ...operation, ...update }
      return next
    })
    publish()
    return next
  }

  function submit<TResult, TInput>(command: TintCommand<TInput>): TintOperationHandle<TResult> {
    const key = command.idempotencyKey
    // A repeated key is the same operation, not a second one. This is what
    // makes a double-clicked button harmless without the UI having to guard.
    if (key) {
      const existing = byKey.get(key)
      if (existing) return existing as unknown as TintOperationHandle<TResult>
    }

    const id = createId()
    const controller = new AbortController()
    controllers.set(id, controller)
    if (command.signal) {
      if (command.signal.aborted) controller.abort()
      else command.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }

    operations = [
      ...operations,
      { id, name: command.name, state: 'queued', createdAt: now().toISOString() },
    ]
    publish()

    const settled = (async (): Promise<TintOperation<TResult>> => {
      const finish = (update: Partial<TintOperation>): TintOperation<TResult> => {
        controllers.delete(id)
        const next = patch(id, { ...update, settledAt: now().toISOString() })
        return (next ?? { id, name: command.name, state: 'failed', createdAt: now().toISOString() }) as TintOperation<TResult>
      }
      try {
        if (controller.signal.aborted) return finish({ state: 'cancelled', problem: new TintAbortError(command.requestId).problem })
        patch(id, { state: 'running' })
        const result = (await options.run(command as TintCommand, {
          signal: controller.signal,
          report: (message) => {
            // Late progress from an already-settled operation is dropped
            // rather than resurrecting it.
            if (controllers.has(id)) patch(id, { message })
          },
        })) as TResult
        if (controller.signal.aborted) return finish({ state: 'cancelled', problem: new TintAbortError(command.requestId).problem })
        return finish({ state: 'succeeded', result })
      } catch (cause) {
        if (controller.signal.aborted) return finish({ state: 'cancelled', problem: new TintAbortError(command.requestId, cause).problem })
        return finish({ state: 'failed', problem: normalizeTintProblem(cause, command.requestId) })
      }
    })()

    const handle: TintOperationHandle<TResult> = {
      id,
      settled,
      cancel: () => controller.abort(),
    }
    if (key) byKey.set(key, handle as unknown as TintOperationHandle<never>)
    return handle
  }

  return {
    submit: submit as OperationAdapter['submit'],
    cancel(operationId) {
      controllers.get(operationId)?.abort()
    },
    clearSettled() {
      operations = operations.filter((operation) => operation.state === 'queued' || operation.state === 'running')
      for (const [key, handle] of byKey) {
        if (!controllers.has(handle.id)) byKey.delete(key)
      }
      publish()
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    stop() {
      for (const controller of controllers.values()) controller.abort()
    },
  }
}
