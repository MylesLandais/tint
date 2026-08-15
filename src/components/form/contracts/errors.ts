/**
 * Typed failures for form submit. Validation issues are *not* errors — they
 * resolve as `FormValidationResult`. These reject the promise.
 *
 * The codes mirror the graph Appendix A taxonomy (`GRAPH_*` → `FORM_*`) so a
 * host that already handles graph transport failures can switch on the same
 * ideas without importing the graph module.
 */

export type FormErrorCode =
  | 'FORM_ABORT'
  | 'FORM_AUTHORIZATION'
  | 'FORM_REVISION_CONFLICT'
  | 'FORM_TRANSPORT'
  | 'FORM_SESSION_DISPOSED'
  | 'FORM_UNKNOWN_SCHEMA'
  | 'FORM_SUPERSEDED'

export class FormError extends Error {
  readonly code: FormErrorCode
  readonly requestId?: string
  readonly details?: Record<string, unknown>

  constructor(
    code: FormErrorCode,
    message: string,
    options: { requestId?: string; details?: Record<string, unknown>; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'FormError'
    this.code = code
    this.requestId = options.requestId
    this.details = options.details
  }
}

export class FormAbortError extends FormError {
  constructor(requestId?: string) {
    super('FORM_ABORT', 'The form operation was cancelled.', { requestId })
    this.name = 'FormAbortError'
  }
}

export class FormAuthorizationError extends FormError {
  constructor(message = 'This form submission is not allowed.', requestId?: string) {
    super('FORM_AUTHORIZATION', message, { requestId })
    this.name = 'FormAuthorizationError'
  }
}

export class FormRevisionConflictError extends FormError {
  constructor(message = 'The form was submitted against a stale revision.', requestId?: string) {
    super('FORM_REVISION_CONFLICT', message, { requestId })
    this.name = 'FormRevisionConflictError'
  }
}

export class FormTransportError extends FormError {
  constructor(message = 'The form transport could not be reached.', requestId?: string, cause?: unknown) {
    super('FORM_TRANSPORT', message, { requestId, cause })
    this.name = 'FormTransportError'
  }
}

export function isFormError(value: unknown): value is FormError {
  return value instanceof FormError
}

export function throwIfAborted(signal?: AbortSignal, requestId?: string): void {
  if (signal?.aborted) throw new FormAbortError(requestId)
}
