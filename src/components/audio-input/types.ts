import type { HTMLAttributes } from 'react'

export type TranscriptChunk = {
  /** A delta for the current recognition segment. */
  text: string
  /** Final chunks are committed; interim chunks replace the current preview. */
  isFinal: boolean
}

export type AudioTranscriber = {
  start: (stream: MediaStream) => void | Promise<void>
  /** Resolves after any final result caused by stopping has been emitted. */
  stop: () => void | Promise<void>
  cancel?: () => void | Promise<void>
  onResult: (listener: (chunk: TranscriptChunk) => void) => () => void
  onError?: (listener: (error: Error) => void) => () => void
}

export type AudioCaptureMeta = {
  duration: number
}

export type AudioInputProps = Omit<HTMLAttributes<HTMLDivElement>, 'onError'> & {
  transcriber: AudioTranscriber
  value: string
  onValueChange: (value: string) => void
  onCapture?: (blob: Blob, meta: AudioCaptureMeta) => void
  onActiveChange?: (active: boolean) => void
  disabled?: boolean
  label?: string
}
