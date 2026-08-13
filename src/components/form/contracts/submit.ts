import { FormAbortError, throwIfAborted } from './errors'
import type { FormSchema } from './schema'
import type { FormIssue, FormValidationResult } from './validate'
import type { FormValues } from './values'

/**
 * Client → server (or in-memory host) contract for a form submit.
 *
 * Tint does not ship a server. Hosts implement `FormTransport` against their
 * backend the same way they implement `AuthTransport`. The graph inspector
 * adapter turns a successful submit into `node.configure`; it does not invent
 * a second envelope.
 *
 * Promise rules (form-shaped slice of graph Appendix A):
 * 1. A promise settles exactly once.
 * 2. Cancellation rejects with `FormAbortError`.
 * 3. Field validation *resolves* as `FormValidationResult` — it does not reject.
 * 4. Authorization failures reject with `FormAuthorizationError`.
 * 5. Revision conflicts reject with `FormRevisionConflictError`.
 * 6. Transport failures reject with `FormTransportError`.
 * 7. Non-idempotent writes do not retry unless `idempotencyKey` is supplied.
 */

export type AsyncOperationOptions = {
  signal?: AbortSignal
  requestId?: string
  deadlineMs?: number
}

export type OperationTiming = {
  startedAt: string
  completedAt: string
  serverDurationMs?: number
}

export type OperationResult<T> = {
  requestId: string
  revision?: string
  value: T
  warnings: readonly FormIssue[]
  timing?: OperationTiming
}

export type FormSubmitEnvelope<TValues = FormValues> = {
  formId: string
  schemaVersion: string
  idempotencyKey: string
  issuedAt: string
  baseRevision?: string
  values: TValues
}

export type FormTransport<TValues = FormValues, TResult = TValues> = {
  validate(
    envelope: FormSubmitEnvelope<TValues>,
    options?: AsyncOperationOptions,
  ): Promise<FormValidationResult>
  submit(
    envelope: FormSubmitEnvelope<TValues>,
    options?: AsyncOperationOptions,
  ): Promise<OperationResult<TResult>>
}

export function createFormSubmitEnvelope<TValues>(
  schema: Pick<FormSchema, 'id' | 'version'>,
  values: TValues,
  extras: { baseRevision?: string; idempotencyKey?: string } = {},
): FormSubmitEnvelope<TValues> {
  return {
    formId: schema.id,
    schemaVersion: schema.version,
    idempotencyKey: extras.idempotencyKey ?? createIdempotencyKey(),
    issuedAt: new Date().toISOString(),
    baseRevision: extras.baseRevision,
    values,
  }
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `form-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createRequestId(options?: AsyncOperationOptions): string {
  return options?.requestId ?? createIdempotencyKey()
}

/**
 * In-memory transport for docs and tests. Hosts replace this with fetch.
 *
 * Duplicate `idempotencyKey`s replay the first result rather than writing
 * twice — the rule the live transport is also expected to keep.
 */
export function createMemoryFormTransport<TValues = FormValues, TResult = TValues>(
  options: {
    persist?: (values: TValues) => TResult | Promise<TResult>
    revision?: () => string
    authorize?: (envelope: FormSubmitEnvelope<TValues>) => boolean | Promise<boolean>
  } = {},
): FormTransport<TValues, TResult> {
  const replay = new Map<string, OperationResult<TResult>>()

  return {
    async validate(_envelope, asyncOptions) {
      throwIfAborted(asyncOptions?.signal, asyncOptions?.requestId)
      return { ok: true, issues: [] }
    },
    async submit(envelope, asyncOptions) {
      const requestId = createRequestId(asyncOptions)
      throwIfAborted(asyncOptions?.signal, requestId)
      assertDeadline(asyncOptions, requestId)

      const cached = replay.get(envelope.idempotencyKey)
      if (cached) return cached

      if (options.authorize && !(await options.authorize(envelope))) {
        const { FormAuthorizationError } = await import('./errors')
        throw new FormAuthorizationError(undefined, requestId)
      }

      const startedAt = new Date().toISOString()
      const started = Date.now()
      try {
        const persisted = options.persist
          ? await options.persist(envelope.values)
          : (envelope.values as unknown as TResult)
        throwIfAborted(asyncOptions?.signal, requestId)
        const result: OperationResult<TResult> = {
          requestId,
          revision: options.revision?.(),
          value: persisted,
          warnings: [],
          timing: {
            startedAt,
            completedAt: new Date().toISOString(),
            serverDurationMs: Date.now() - started,
          },
        }
        replay.set(envelope.idempotencyKey, result)
        return result
      } catch (cause) {
        if (cause instanceof FormAbortError) throw cause
        const { FormTransportError, FormError } = await import('./errors')
        if (cause instanceof FormError) throw cause
        throw new FormTransportError(undefined, requestId, cause)
      }
    },
  }
}

function assertDeadline(options: AsyncOperationOptions | undefined, requestId: string): void {
  if (options?.deadlineMs == null) return
  if (options.deadlineMs <= 0) throw new FormAbortError(requestId)
}
