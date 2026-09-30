export type TranscriptChunk = {
  /** Delta for the current recognition segment. */
  text: string
  /** Final chunks append; interim chunks replace the preview. */
  isFinal: boolean
}

/** The host chooses the recognition service; Tint only provides the microphone stream. */
export type AudioTranscriber = {
  start: (stream: MediaStream) => void | Promise<void>
  stop: () => void | Promise<void>
  cancel?: () => void | Promise<void>
  onResult: (listener: (chunk: TranscriptChunk) => void) => () => void
  onError?: (listener: (error: Error) => void) => () => void
}

export type AudioCaptureMeta = { duration: number }

export type AudioInputStatus = 'idle' | 'requesting' | 'recording' | 'stopping' | 'error' | 'unsupported'
export type AudioInputSnapshot = { status: AudioInputStatus; elapsed: number; error?: string }

export type AudioInputCallbacks = {
  onValueChange: (value: string) => void
  onCapture?: (blob: Blob, meta: AudioCaptureMeta) => void
  onActiveChange?: (active: boolean) => void
}
