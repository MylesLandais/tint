import { joinTranscript } from './model'
import type { AudioInputCallbacks, AudioInputSnapshot, AudioInputStatus, AudioTranscriber, TranscriptChunk } from './types'

type RecordingSession = {
  base: string
  finalText: string
  interimText: string
  stream?: MediaStream
  recorder?: MediaRecorder
  chunks: Blob[]
  startedAt: number
  transcriber: AudioTranscriber
  onCapture?: AudioInputCallbacks['onCapture']
  cancelled: boolean
}

function stopTracks(stream?: MediaStream): void {
  stream?.getTracks().forEach((track) => track.stop())
}

async function finishRecorder(session: RecordingSession, keep: boolean): Promise<void> {
  const recorder = session.recorder
  if (!recorder || recorder.state === 'inactive') return
  await new Promise<void>((resolve) => {
    recorder.addEventListener('stop', () => {
      try {
        if (keep && session.onCapture && session.chunks.length) {
          session.onCapture(new Blob(session.chunks, { type: recorder.mimeType || undefined }), {
            duration: Math.max(0, (performance.now() - session.startedAt) / 1000),
          })
        }
      } finally { resolve() }
    }, { once: true })
    try { recorder.stop() } catch { resolve() }
  })
}

/** A browser capture session with no UI framework ownership. */
export class AudioInputSession {
  private transcriber: AudioTranscriber
  private callbacks: AudioInputCallbacks
  private current?: RecordingSession
  private listeners = new Set<(snapshot: AudioInputSnapshot) => void>()
  private snapshotValue: AudioInputSnapshot = { status: 'idle', elapsed: 0 }
  private unsubscribeResult?: () => void
  private unsubscribeError?: () => void
  private timer?: ReturnType<typeof setInterval>
  private mounted = false
  private disposed = false

  constructor(transcriber: AudioTranscriber, callbacks: AudioInputCallbacks) {
    this.transcriber = transcriber
    this.callbacks = callbacks
  }

  get snapshot(): AudioInputSnapshot { return this.snapshotValue }

  subscribe(listener: (snapshot: AudioInputSnapshot) => void): () => void {
    this.listeners.add(listener)
    listener(this.snapshotValue)
    return () => this.listeners.delete(listener)
  }

  private update(patch: Partial<AudioInputSnapshot>): void {
    this.snapshotValue = { ...this.snapshotValue, ...patch }
    for (const listener of this.listeners) listener(this.snapshotValue)
  }

  setCallbacks(callbacks: AudioInputCallbacks): void { this.callbacks = callbacks }

  mount(): void {
    if (this.mounted || this.disposed) return
    this.mounted = true
    this.subscribeToTranscriber()
  }

  setTranscriber(next: AudioTranscriber): void {
    if (this.disposed || next === this.transcriber) return
    this.unsubscribeFromTranscriber()
    this.abandonActive(true)
    this.transcriber = next
    if (this.mounted) this.subscribeToTranscriber()
  }

  private subscribeToTranscriber(): void {
    this.unsubscribeResult = this.transcriber.onResult((chunk) => this.handleChunk(chunk))
    this.unsubscribeError = this.transcriber.onError?.((error) => this.handleTranscriberError(error))
  }

  private unsubscribeFromTranscriber(): void {
    this.unsubscribeResult?.()
    this.unsubscribeError?.()
    this.unsubscribeResult = undefined
    this.unsubscribeError = undefined
  }

  private release(session: RecordingSession, status: AudioInputStatus, error?: string): void {
    if (this.disposed) return
    if (this.current && this.current !== session) return
    this.current = undefined
    stopTracks(session.stream)
    this.stopTimer()
    this.update({ status, error, elapsed: 0 })
    this.callbacks.onActiveChange?.(false)
  }

  private startTimer(): void {
    this.stopTimer()
    this.timer = setInterval(() => {
      const session = this.current
      if (session && this.snapshotValue.status === 'recording') {
        this.update({ elapsed: Math.max(0, (performance.now() - session.startedAt) / 1000) })
      }
    }, 250)
  }

  private stopTimer(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = undefined
  }

  private handleChunk(chunk: TranscriptChunk): void {
    const session = this.current
    if (!session || session.cancelled) return
    if (chunk.isFinal) {
      session.finalText = joinTranscript(session.finalText, chunk.text)
      session.interimText = ''
    } else session.interimText = chunk.text
    this.callbacks.onValueChange(joinTranscript(session.base, session.finalText, session.interimText))
  }

  private handleTranscriberError(error: Error): void {
    const session = this.current
    if (!session || session.cancelled) return
    session.cancelled = true
    this.current = undefined
    void finishRecorder(session, false).finally(() => this.release(session, 'error', error.message || 'Transcription failed.'))
  }

  async begin(base: string): Promise<void> {
    if (this.disposed || this.current || this.snapshotValue.status === 'requesting' || this.snapshotValue.status === 'stopping') return
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.update({ status: 'unsupported', error: 'Voice input is not supported in this browser.' })
      return
    }
    const onCapture = this.callbacks.onCapture
    if (onCapture && typeof MediaRecorder === 'undefined') {
      this.update({ status: 'error', error: 'Audio recording is not supported in this browser.' })
      return
    }
    const session: RecordingSession = {
      base, finalText: '', interimText: '', chunks: [], startedAt: performance.now(),
      transcriber: this.transcriber, onCapture, cancelled: false,
    }
    this.current = session
    this.update({ status: 'requesting', error: undefined, elapsed: 0 })
    this.callbacks.onActiveChange?.(true)
    try {
      session.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (this.current !== session || session.cancelled) { stopTracks(session.stream); return }
      if (onCapture) {
        session.recorder = new MediaRecorder(session.stream)
        session.recorder.addEventListener('dataavailable', (event) => {
          if (event.data.size) session.chunks.push(event.data)
        })
        session.recorder.start()
      }
      await session.transcriber.start(session.stream)
      if (this.current !== session || session.cancelled) return
      session.startedAt = performance.now()
      this.update({ status: 'recording' })
      this.startTimer()
    } catch (cause) {
      session.cancelled = true
      this.current = undefined
      await finishRecorder(session, false)
      this.release(session, 'error', cause instanceof Error ? cause.message : 'Could not start voice input.')
    }
  }

  async stop(): Promise<void> {
    const session = this.current
    if (!session || this.snapshotValue.status !== 'recording') return
    this.update({ status: 'stopping' })
    this.stopTimer()
    try {
      await session.transcriber.stop()
      if (session.cancelled) { await finishRecorder(session, false); return }
      if (this.current === session) this.current = undefined
      await finishRecorder(session, true)
      this.release(session, 'idle')
    } catch (cause) {
      session.cancelled = true
      if (this.current === session) this.current = undefined
      await finishRecorder(session, false)
      this.release(session, 'error', cause instanceof Error ? cause.message : 'Could not stop voice input.')
    }
  }

  async cancel(): Promise<void> {
    const session = this.current
    if (!session) return
    session.cancelled = true
    this.current = undefined
    this.callbacks.onValueChange(session.base)
    try { await (session.transcriber.cancel ? session.transcriber.cancel() : session.transcriber.stop()) }
    catch { /* Cancellation still releases the microphone and restores the draft. */ }
    finally { await finishRecorder(session, false); this.release(session, 'idle') }
  }

  private abandonActive(restoreDraft: boolean): void {
    const session = this.current
    if (!session) return
    session.cancelled = true
    this.current = undefined
    this.stopTimer()
    if (restoreDraft) this.callbacks.onValueChange(session.base)
    try { void Promise.resolve(session.transcriber.cancel?.()).catch(() => undefined) } catch { /* Teardown continues. */ }
    void finishRecorder(session, false)
    stopTracks(session.stream)
    this.update({ status: 'idle', elapsed: 0, error: undefined })
    this.callbacks.onActiveChange?.(false)
  }

  dispose(): void {
    this.unsubscribeFromTranscriber()
    this.abandonActive(false)
    this.disposed = true
    this.stopTimer()
    this.mounted = false
    this.listeners.clear()
  }
}
