import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AudioTranscriber, TranscriptChunk } from '../../../core/audio-input/types'
import AudioInput from './AudioInput.svelte'

function makeTranscriber() {
  let result: ((chunk: TranscriptChunk) => void) | undefined
  const transcriber: AudioTranscriber = {
    start: vi.fn(), stop: vi.fn(), cancel: vi.fn(),
    onResult(listener) { result = listener; return () => { result = undefined } },
  }
  return { transcriber, emit: (chunk: TranscriptChunk) => result?.(chunk) }
}

const originalDevices = navigator.mediaDevices
afterEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: originalDevices })
  vi.restoreAllMocks()
})

describe('Svelte AudioInput', () => {
  it('exposes recording controls and sends transcript intent to the host', async () => {
    const { transcriber, emit } = makeTranscriber()
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) } })
    const onValueChange = vi.fn()
    const onActiveChange = vi.fn()
    render(AudioInput, { transcriber, value: 'Before', onValueChange, onActiveChange })
    await fireEvent.click(screen.getByRole('button', { name: 'Start Voice input' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Stop Voice input' })).toBeEnabled())
    emit({ text: 'hello', isFinal: false })
    expect(onValueChange).toHaveBeenLastCalledWith('Before hello')
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel Voice input' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Start Voice input' })).toBeInTheDocument())
    expect(onValueChange).toHaveBeenLastCalledWith('Before')
    expect(onActiveChange.mock.calls).toEqual([[true], [false]])
  })

  it('labels the unsupported path and does not request permission', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined })
    const { transcriber } = makeTranscriber()
    render(AudioInput, { transcriber, value: '', onValueChange: vi.fn() })
    await fireEvent.click(screen.getByRole('button', { name: 'Start Voice input' }))
    expect(screen.getByRole('alert')).toHaveTextContent('not supported')
    expect(screen.getByRole('button', { name: 'Voice input unavailable' })).toBeDisabled()
  })
})
