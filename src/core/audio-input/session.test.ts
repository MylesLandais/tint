import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioInputSession } from './session'
import type { AudioTranscriber, TranscriptChunk } from './types'

function makeTranscriber() {
  let result: ((chunk: TranscriptChunk) => void) | undefined
  let error: ((cause: Error) => void) | undefined
  const transcriber: AudioTranscriber = {
    start: vi.fn(), stop: vi.fn(), cancel: vi.fn(),
    onResult(listener) { result = listener; return () => { result = undefined } },
    onError(listener) { error = listener; return () => { error = undefined } },
  }
  return { transcriber, emit: (chunk: TranscriptChunk) => result?.(chunk), fail: (cause: Error) => error?.(cause) }
}

const originalDevices = navigator.mediaDevices
const originalRecorder = globalThis.MediaRecorder

afterEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: originalDevices })
  Object.defineProperty(globalThis, 'MediaRecorder', { configurable: true, value: originalRecorder })
  vi.restoreAllMocks()
})

describe('AudioInputSession', () => {
  it('streams interim and final text and restores the draft on cancel', async () => {
    const { transcriber, emit } = makeTranscriber()
    const stopTrack = vi.fn()
    const stream = { getTracks: () => [{ stop: stopTrack }] } as unknown as MediaStream
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) } })
    const onValueChange = vi.fn()
    const onActiveChange = vi.fn()
    const session = new AudioInputSession(transcriber, { onValueChange, onActiveChange })
    session.mount()
    await session.begin('Before')
    expect(session.snapshot.status).toBe('recording')
    emit({ text: 'hello', isFinal: false })
    expect(onValueChange).toHaveBeenLastCalledWith('Before hello')
    emit({ text: 'hello world', isFinal: true })
    expect(onValueChange).toHaveBeenLastCalledWith('Before hello world')
    await session.cancel()
    expect(onValueChange).toHaveBeenLastCalledWith('Before')
    emit({ text: 'late', isFinal: true })
    expect(onValueChange).toHaveBeenLastCalledWith('Before')
    expect(onActiveChange.mock.calls).toEqual([[true], [false]])
    expect(stopTrack).toHaveBeenCalled()
    session.dispose()
  })

  it('reports missing microphone support without activating a session', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined })
    const { transcriber } = makeTranscriber()
    const onActiveChange = vi.fn()
    const session = new AudioInputSession(transcriber, { onValueChange: vi.fn(), onActiveChange })
    await session.begin('')
    expect(session.snapshot.status).toBe('unsupported')
    expect(session.snapshot.error).toMatch(/not supported/)
    expect(onActiveChange).not.toHaveBeenCalled()
  })

  it('tears down an active session when the host swaps transcribers', async () => {
    const old = makeTranscriber()
    const next = makeTranscriber()
    const stopTrack = vi.fn()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] }) } })
    const onValueChange = vi.fn()
    const session = new AudioInputSession(old.transcriber, { onValueChange })
    session.mount()
    await session.begin('Draft')
    session.setTranscriber(next.transcriber)
    expect(session.snapshot.status).toBe('idle')
    expect(onValueChange).toHaveBeenLastCalledWith('Draft')
    expect(stopTrack).toHaveBeenCalled()
    old.emit({ text: 'stale', isFinal: true })
    expect(onValueChange).toHaveBeenCalledTimes(1)
    session.dispose()
  })

  it('ignores a late stop from a replaced transcriber', async () => {
    const old = makeTranscriber()
    const next = makeTranscriber()
    let finishOldStop: (() => void) | undefined
    old.transcriber.stop = () => new Promise<void>((resolve) => { finishOldStop = resolve })
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) } })
    const onActiveChange = vi.fn()
    const session = new AudioInputSession(old.transcriber, { onValueChange: vi.fn(), onActiveChange })
    session.mount()
    await session.begin('Old')
    const oldStop = session.stop()
    session.setTranscriber(next.transcriber)
    await session.begin('New')
    finishOldStop?.()
    await oldStop
    expect(session.snapshot.status).toBe('recording')
    expect(onActiveChange.mock.calls).toEqual([[true], [false], [true]])
    session.dispose()
  })

  it('records a Blob only after a successful stop', async () => {
    const { transcriber } = makeTranscriber()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) } })
    class MockRecorder extends EventTarget {
      state = 'inactive'
      mimeType = 'audio/webm'
      start() { this.state = 'recording' }
      stop() {
        this.dispatchEvent(new MessageEvent('dataavailable', { data: new Blob(['audio'], { type: 'audio/webm' }) }))
        this.state = 'inactive'
        this.dispatchEvent(new Event('stop'))
      }
    }
    Object.defineProperty(globalThis, 'MediaRecorder', { configurable: true, value: MockRecorder })
    const onCapture = vi.fn()
    const session = new AudioInputSession(transcriber, { onValueChange: vi.fn(), onCapture })
    session.mount()
    await session.begin('')
    await session.stop()
    expect(onCapture).toHaveBeenCalledOnce()
    expect(onCapture.mock.calls[0][0]).toBeInstanceOf(Blob)
    expect(onCapture.mock.calls[0][1].duration).toBeGreaterThanOrEqual(0)
    expect(session.snapshot.status).toBe('idle')
    session.dispose()
  })
})
