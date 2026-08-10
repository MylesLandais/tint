import type { HTMLAttributes } from 'react'

export type TranscriptChunk = {
  /** A delta for the current recognition segment. */
  text: string
  /** Final chunks are committed; interim chunks replace the current preview. */
  isFinal: boolean
}

/**
 * The speech-recognition seam. Tint captures the microphone and hands the
 * stream over; it never chooses a service and never sends audio anywhere.
 *
 * A browser's built-in recognition may still process audio remotely — the
 * adapter boundary is an architectural one, not a privacy guarantee.
 */
export type AudioTranscriber = {
  /** Begin recognition against a live capture stream. */
  start: (stream: MediaStream) => void | Promise<void>
  /** Resolves after any final result caused by stopping has been emitted. */
  stop: () => void | Promise<void>
  /** Abandon without emitting a final result. Falls back to `stop` if absent. */
  cancel?: () => void | Promise<void>
  /** Subscribe to transcript deltas. Returns an unsubscribe function. */
  onResult: (listener: (chunk: TranscriptChunk) => void) => () => void
  /** Subscribe to recognition failures. Returns an unsubscribe function. */
  onError?: (listener: (error: Error) => void) => () => void
}

export type AudioCaptureMeta = {
  /** Elapsed recording time in seconds, measured from the first captured frame. */
  duration: number
}

export type AudioInputProps = Omit<HTMLAttributes<HTMLDivElement>, 'onError'> & {
  /** Host-owned recognition adapter. Changing identity tears down any session. */
  transcriber: AudioTranscriber
  /**
   * The controlled draft this appends into. Captured at record time, so
   * cancelling restores exactly what was there before.
   */
  value: string
  /** Receives interim previews and committed transcript text. */
  onValueChange: (value: string) => void
  /**
   * Receives a voice-note Blob after Stop. Supplying this turns on
   * `MediaRecorder`; omit it and only recognition runs.
   */
  onCapture?: (blob: Blob, meta: AudioCaptureMeta) => void
  /**
   * Reports whether a session is live, so a host can lock adjacent text
   * editing while the transcript is being written into it.
   */
  onActiveChange?: (active: boolean) => void
  /** Blocks starting a recording. Has no effect on one already running. */
  disabled?: boolean
  /**
   * Names the controls: "Start {label}", "Stop {label}", "Cancel {label}".
   * Not visible text.
   */
  label?: string
}
