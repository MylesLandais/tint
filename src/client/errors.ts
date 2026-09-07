import type { TintProblem } from './types'

export class TintError extends Error {
  readonly problem: TintProblem

  constructor(problem: TintProblem, options: { cause?: unknown } = {}) {
    super(problem.detail ?? problem.title, { cause: options.cause })
    this.name = 'TintError'
    this.problem = problem
  }
}

export class TintCapabilityError extends TintError {
  readonly capability: string

  constructor(capability: string) {
    super({
      code: 'missing_capability',
      title: 'Tint capability is not configured',
      detail: `The Tint client does not provide the “${capability}” capability.`,
      metadata: { capability },
    })
    this.name = 'TintCapabilityError'
    this.capability = capability
  }
}

export class TintAbortError extends TintError {
  constructor(requestId?: string, cause?: unknown) {
    super({ code: 'aborted', title: 'Operation cancelled', requestId }, { cause })
    this.name = 'TintAbortError'
  }
}

export class TintAuthorizationError extends TintError {
  constructor(detail = 'This operation is not authorized.', requestId?: string) {
    super({ code: 'not_authorized', title: 'Not authorized', detail, status: 403, requestId })
    this.name = 'TintAuthorizationError'
  }
}

export class TintConflictError extends TintError {
  constructor(detail = 'The resource changed before this operation completed.', requestId?: string) {
    super({ code: 'revision_conflict', title: 'Revision conflict', detail, status: 409, requestId })
    this.name = 'TintConflictError'
  }
}

export class TintTransportError extends TintError {
  constructor(detail = 'The service could not be reached.', requestId?: string, cause?: unknown) {
    super({ code: 'transport_error', title: 'Transport error', detail, requestId }, { cause })
    this.name = 'TintTransportError'
  }
}

export function normalizeTintProblem(cause: unknown, requestId?: string): TintProblem {
  if (cause instanceof TintError) return cause.problem
  if (typeof DOMException !== 'undefined' && cause instanceof DOMException && cause.name === 'AbortError') {
    return { code: 'aborted', title: 'Operation cancelled', requestId }
  }
  if (cause instanceof Error) {
    return { code: 'transport_error', title: 'Operation failed', detail: cause.message, requestId }
  }
  return { code: 'transport_error', title: 'Operation failed', requestId }
}
