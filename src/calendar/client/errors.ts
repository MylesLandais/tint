/** Every failure this client raises, so a host can branch without parsing strings. */
export type CalDavErrorCode =
  | 'request_failed'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'precondition_failed'
  | 'malformed_response'
  | 'no_calendar_home'

export class CalDavError extends Error {
  readonly code: CalDavErrorCode
  readonly status?: number

  constructor(
    code: CalDavErrorCode,
    message: string,
    options: { status?: number; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'CalDavError'
    this.code = code
    this.status = options.status
  }
}

/**
 * Map an HTTP status onto a code.
 *
 * `412 Precondition Failed` is called out because it is the ordinary outcome of
 * an ETag-guarded write losing a race, not a bug — a host should re-read and
 * retry rather than surface it as an error.
 */
export function calDavErrorForStatus(status: number, detail?: string): CalDavError {
  const code: CalDavErrorCode =
    status === 401
      ? 'unauthorized'
      : status === 403
        ? 'forbidden'
        : status === 404
          ? 'not_found'
          : status === 412
            ? 'precondition_failed'
            : 'request_failed'
  return new CalDavError(code, detail ?? `CalDAV request failed with ${status}.`, { status })
}
