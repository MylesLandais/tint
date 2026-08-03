import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatDemo } from './ChatDemo'

describe('ChatDemo scenario runner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs approval and source states without making a network request', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    render(<ChatDemo />)

    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    act(() => vi.advanceTimersByTime(600))
    fireEvent.click(screen.getByRole('button', { name: 'Allow lookup' }))
    act(() => vi.advanceTimersByTime(5000))

    expect(
      screen.getByText(/The strongest transcript patterns are/),
    ).toBeInTheDocument()
    expect(screen.getByText('Sources')).toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('stops a stream and recovers the error scenario on retry', () => {
    render(<ChatDemo />)
    const scenario = screen.getByRole('combobox', { name: 'Demo scenario' })

    fireEvent.change(scenario, { target: { value: 'streaming' } })
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    act(() => vi.advanceTimersByTime(700))
    fireEvent.click(screen.getByRole('button', { name: 'Stop response' }))
    expect(screen.getByText('Stopped')).toBeInTheDocument()

    fireEvent.change(scenario, { target: { value: 'error' } })
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('The mocked response was interrupted.')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Retry' })[0]!)
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByText(/The retry succeeded/)).toBeInTheDocument()
  })

  it('simulates local attachment progress and reset', () => {
    const { container } = render(<ChatDemo />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Demo scenario' }), {
      target: { value: 'attachment' },
    })
    const file = new File(['fixture'], 'brief.md', { type: 'text/markdown' })
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!
    fireEvent.change(input, { target: { files: [file] } })

    act(() => vi.advanceTimersByTime(600))
    expect(screen.getByText('brief.md')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
    act(() => vi.advanceTimersByTime(5000))

    expect(screen.getByText('Local analysis result')).toBeInTheDocument()
    expect(screen.getByText(/no file was uploaded/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset conversation' }))
    expect(screen.queryByText('Local analysis result')).not.toBeInTheDocument()
  })
})
