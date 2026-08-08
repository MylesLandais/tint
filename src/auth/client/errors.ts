import type { AuthProblemShape } from './types'

export class AuthError extends Error {
  readonly code: string
  readonly status?: number
  readonly retryAfter?: number

  constructor(code: string, message: string, options: { status?: number; retryAfter?: number; cause?: unknown } = {}) {
    super(message, { cause: options.cause })
    this.name = 'AuthError'
    this.code = code
    this.status = options.status
    this.retryAfter = options.retryAfter
  }
}

export class UnsupportedAuthOperationError extends AuthError {
  constructor(operation: string) {
    super('unsupported_operation', `This auth deployment does not support ${operation}.`)
  }
}

export async function authErrorFromResponse(response: Response): Promise<AuthError> {
  const body = (await response.json().catch(() => ({}))) as AuthProblemShape
  const retryHeader = Number.parseInt(response.headers.get('retry-after') ?? '', 10)
  return new AuthError(body.code ?? 'request_failed', body.detail ?? body.title ?? safeStatusMessage(response.status), {
    status: response.status,
    retryAfter: body.retryAfter ?? (Number.isFinite(retryHeader) ? retryHeader : undefined),
  })
}

function safeStatusMessage(status: number): string {
  if (status === 401) return 'The credentials were not accepted.'
  if (status === 403) return 'This sign-in is not allowed by policy.'
  if (status === 429) return 'Too many attempts. Try again later.'
  return 'The authentication request failed.'
}

export function normalizeAuthError(cause: unknown): AuthError {
  if (cause instanceof AuthError) return cause
  return new AuthError('network_error', 'The authentication service could not be reached.', { cause })
}
