import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioInput } from './AudioInput'
import type { AudioTranscriber } from './types'

function makeTranscriber() {
  let result: ((chunk: { text: string; isFinal: boolean }) => void) | undefined
  const transcriber: AudioTranscriber = {
    start: vi.fn(),
    stop: vi.fn(),
    onResult(listener) {
      result = listener
      return () => { result = undefined }
    },
  }
  return { transcriber, emit: (chunk: { text: string; isFinal: boolean }) => result?.(chunk) }
}

afterEach(() => vi.restoreAllMocks())

describe('AudioInput', () => {
  it('streams interim and final text, then restores the snapshot on cancel', async () => {
    const { transcriber, emit } = makeTranscriber()
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    })
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } })
    const onValueChange = vi.fn()
    render(<AudioInput transcriber={transcriber} value="Before" onValueChange={onValueChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Start Voice input' }))
    await act(async () => {})
    expect(getUserMedia).toHaveBeenCalled()
    act(() => emit({ text: 'hello', isFinal: false }))
    expect(onValueChange).toHaveBeenLastCalledWith('Before hello')
    act(() => emit({ text: 'hello world', isFinal: true }))
    expect(onValueChange).toHaveBeenLastCalledWith('Before hello world')

    fireEvent.click(screen.getByRole('button', { name: 'Cancel Voice input' }))
    await act(async () => {})
    expect(onValueChange).toHaveBeenLastCalledWith('Before')
    act(() => emit({ text: 'late result', isFinal: true }))
    expect(onValueChange).not.toHaveBeenLastCalledWith('Before late result')
  })

  it('shows the unsupported path without requesting permission', () => {
    const previous = navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined })
    const { transcriber } = makeTranscriber()
    render(<AudioInput transcriber={transcriber} value="" onValueChange={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start Voice input' }))
    expect(screen.getByRole('alert')).toHaveTextContent('not supported')
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: previous })
  })
})
