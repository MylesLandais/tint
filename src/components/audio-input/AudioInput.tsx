import { Mic, Square, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { ChatActionButton } from '../chat/ChatComposer'
import { Icon } from '../icon'
import { formatTime } from '../media'
import type { AudioInputProps, AudioTranscriber, TranscriptChunk } from './types'

type InputState = 'idle' | 'requesting' | 'recording' | 'stopping' | 'error' | 'unsupported'

type RecordingSession = {
  id: number
  base: string
  finalText: string
  interimText: string
  stream?: MediaStream
  recorder?: MediaRecorder
  chunks: Blob[]
  startedAt: number
  transcriber: AudioTranscriber
  onCapture?: AudioInputProps['onCapture']
  cancelled: boolean
}

function joinText(...parts: string[]) {
  return parts.reduce((result, part) => {
    if (!part) return result
    if (!result) return part
    return /\s$/.test(result) || /^\s/.test(part) ? `${result}${part}` : `${result} ${part}`
  }, '')
}

function stopTracks(stream?: MediaStream) {
  stream?.getTracks().forEach((track) => track.stop())
}

export function AudioInput({
  transcriber,
  value,
  onValueChange,
  onCapture,
  onActiveChange,
  disabled = false,
  label = 'Voice input',
  className,
  ...props
}: AudioInputProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef(value)
  const onValueChangeRef = useRef(onValueChange)
  const onActiveChangeRef = useRef(onActiveChange)
  const sessionRef = useRef<RecordingSession | undefined>(undefined)
  const sequenceRef = useRef(0)
  const [state, setState] = useState<InputState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string>()

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    onValueChangeRef.current = onValueChange
    onActiveChangeRef.current = onActiveChange
  }, [onValueChange, onActiveChange])

  const focusStart = () => {
    window.setTimeout(() => rootRef.current?.querySelector<HTMLButtonElement>('button')?.focus(), 0)
  }

  const finishRecorder = (session: RecordingSession, keep: boolean) => {
    const recorder = session.recorder
    if (!recorder || recorder.state === 'inactive') return Promise.resolve()
    return new Promise<void>((resolve) => {
      recorder.addEventListener('stop', () => {
        if (keep && session.onCapture && session.chunks.length) {
          const blob = new Blob(session.chunks, { type: recorder.mimeType || undefined })
          session.onCapture(blob, {
            duration: Math.max(0, (performance.now() - session.startedAt) / 1000),
          })
        }
        resolve()
      }, { once: true })
      try {
        recorder.stop()
      } catch {
        resolve()
      }
    })
  }

  const release = (session: RecordingSession, nextState: InputState, nextError?: string) => {
    if (sessionRef.current === session) sessionRef.current = undefined
    stopTracks(session.stream)
    setElapsed(0)
    setError(nextError)
    setState(nextState)
    onActiveChangeRef.current?.(false)
    if (nextState === 'idle') focusStart()
  }

  const handleChunk = (chunk: TranscriptChunk) => {
    const session = sessionRef.current
    if (!session || session.cancelled) return
    if (chunk.isFinal) {
      session.finalText = joinText(session.finalText, chunk.text)
      session.interimText = ''
    } else {
      session.interimText = chunk.text
    }
    onValueChangeRef.current(joinText(session.base, session.finalText, session.interimText))
  }

  const handleTranscriberError = (cause: Error) => {
    const session = sessionRef.current
    if (!session || session.cancelled) return
    session.cancelled = true
    sessionRef.current = undefined
    void finishRecorder(session, false).finally(() => release(session, 'error', cause.message || 'Transcription failed.'))
  }

  useEffect(() => {
    const unsubscribeResult = transcriber.onResult(handleChunk)
    const unsubscribeError = transcriber.onError?.(handleTranscriberError)
    return () => {
      unsubscribeResult()
      unsubscribeError?.()
      const session = sessionRef.current
      if (session) {
        session.cancelled = true
        sessionRef.current = undefined
        void transcriber.cancel?.()
        void finishRecorder(session, false)
        stopTracks(session.stream)
      }
    }
  }, [transcriber])

  useEffect(() => {
    if (state !== 'recording') return
    const started = performance.now()
    const timer = window.setInterval(() => {
      const session = sessionRef.current
      setElapsed(session ? (performance.now() - started) / 1000 : 0)
    }, 250)
    return () => window.clearInterval(timer)
  }, [state])

  const begin = async () => {
    if (disabled || sessionRef.current || state === 'requesting') return
    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unsupported')
      setError('Voice input is not supported in this browser.')
      return
    }
    if (onCapture && typeof MediaRecorder === 'undefined') {
      setState('error')
      setError('Audio recording is not supported in this browser.')
      return
    }
    const session: RecordingSession = {
      id: ++sequenceRef.current,
      base: valueRef.current,
      finalText: '',
      interimText: '',
      chunks: [],
      startedAt: performance.now(),
      transcriber,
      onCapture,
      cancelled: false,
    }
    sessionRef.current = session
    setError(undefined)
    setState('requesting')
    onActiveChangeRef.current?.(true)
    try {
      session.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (sessionRef.current !== session || session.cancelled) {
        stopTracks(session.stream)
        return
      }
      if (onCapture) {
        session.recorder = new MediaRecorder(session.stream)
        session.recorder.addEventListener('dataavailable', (event) => {
          if (event.data.size) session.chunks.push(event.data)
        })
        session.recorder.start()
      }
      await transcriber.start(session.stream)
      if (sessionRef.current !== session || session.cancelled) return
      session.startedAt = performance.now()
      setState('recording')
    } catch (cause) {
      session.cancelled = true
      sessionRef.current = undefined
      await finishRecorder(session, false)
      stopTracks(session.stream)
      release(session, 'error', cause instanceof Error ? cause.message : 'Could not start voice input.')
    }
  }

  const stop = async () => {
    const session = sessionRef.current
    if (!session || state !== 'recording') return
    setState('stopping')
    try {
      await session.transcriber.stop()
      if (sessionRef.current === session) sessionRef.current = undefined
      await finishRecorder(session, true)
      release(session, 'idle')
    } catch (cause) {
      session.cancelled = true
      sessionRef.current = undefined
      await finishRecorder(session, false)
      release(session, 'error', cause instanceof Error ? cause.message : 'Could not stop voice input.')
    }
  }

  const cancel = async () => {
    const session = sessionRef.current
    if (!session) return
    session.cancelled = true
    sessionRef.current = undefined
    onValueChangeRef.current(session.base)
    try {
      await (session.transcriber.cancel ? session.transcriber.cancel() : session.transcriber.stop())
    } finally {
      await finishRecorder(session, false)
      release(session, 'idle')
    }
  }

  const active = state === 'recording' || state === 'stopping' || state === 'requesting'

  return (
    <div ref={rootRef} className={cn('flex items-center gap-1', className)} {...props}>
      {active ? (
        <>
          <span className="flex items-center gap-1.5 rounded-lg bg-tint-accent-soft px-2 py-1 text-xs text-tint-accent" role="status">
            <motion.span
              aria-hidden="true"
              className="flex h-4 items-end gap-px"
              animate={state === 'recording' ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.6 }}
              transition={{ duration: 1, repeat: state === 'recording' ? Infinity : 0 }}
            >
              {[0.45, 0.8, 0.6, 1, 0.55].map((height, index) => (
                <span key={index} className="w-0.5 rounded-full bg-current" style={{ height: `${height * 100}%` }} />
              ))}
            </motion.span>
            <span>{state === 'requesting' ? 'Requesting mic…' : formatTime(elapsed)}</span>
          </span>
          <ChatActionButton label={`Cancel ${label}`} onClick={() => void cancel()} disabled={state === 'stopping'} className="text-tint-muted hover:bg-tint-surface hover:text-tint-ink">
            <Icon icon={X} />
          </ChatActionButton>
          <ChatActionButton label={`Stop ${label}`} onClick={() => void stop()} disabled={state !== 'recording'} className="bg-tint-accent text-tint-on-accent hover:bg-tint-accent-hover">
            <Icon icon={Square} size="xs" className="fill-current" />
          </ChatActionButton>
        </>
      ) : (
        <ChatActionButton label={state === 'unsupported' ? 'Voice input unavailable' : `Start ${label}`} onClick={() => void begin()} disabled={disabled || state === 'unsupported'} className="text-tint-muted hover:bg-tint-surface hover:text-tint-ink">
          <Icon icon={Mic} />
        </ChatActionButton>
      )}
      {error ? <span role="alert" className="max-w-48 text-[0.6875rem] text-tint-danger-ink">{error}</span> : null}
    </div>
  )
}
