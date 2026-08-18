import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChatDemo } from './ChatDemo'

describe('ChatDemo scenario runner', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.location.hash = '#/components/chat'
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
    const scenario = screen.getByRole('radio', { name: 'Streaming answer' })

    fireEvent.click(scenario)
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    act(() => vi.advanceTimersByTime(700))
    fireEvent.click(screen.getByRole('button', { name: 'Stop response' }))
    expect(screen.getByText('Stopped')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: 'Error recovery' }))
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    act(() => vi.advanceTimersByTime(1000))
    expect(screen.getByText('The mocked response was interrupted.')).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Retry' })[0]!)
    act(() => vi.advanceTimersByTime(5000))
    expect(screen.getByText(/The retry succeeded/)).toBeInTheDocument()
  })

  it('simulates local attachment progress and reset', () => {
    const { container } = render(<ChatDemo />)
    fireEvent.click(screen.getByRole('radio', { name: 'Attachment analysis' }))
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

  it('renders a preference split and locks the chosen response', () => {
    render(<ChatDemo />)
    fireEvent.click(screen.getByRole('radio', { name: 'Response preference' }))
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    act(() => vi.advanceTimersByTime(2000))

    expect(screen.getByText('Which response do you prefer?')).toBeInTheDocument()
    expect(screen.getByText('Response 1')).toBeInTheDocument()
    expect(screen.getByText('Response 2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: /Response 1/i }))
    expect(screen.getByText('Preference recorded')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Response 1/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    fireEvent.click(screen.getByRole('radio', { name: /Response 2/i }))
    expect(screen.getByRole('radio', { name: /Response 2/i })).toHaveAttribute(
      'aria-checked',
      'false',
    )
  })

  it('opens the group scenario from the hash query', () => {
    window.location.hash = '#/components/chat?scenario=group'
    render(<ChatDemo />)
    expect(screen.getByRole('radio', { name: 'Group chat TTS' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByText(/One mock trace spans both agents/)).toBeInTheDocument()
  })

  it('auto-replays the group scenario when the hash asks', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    window.location.hash = '#/components/chat?scenario=group&replay=1'
    render(<ChatDemo />)
    act(() => vi.advanceTimersByTime(5000))

    expect(screen.getByText(/I'm Jordan/)).toBeInTheDocument()
    expect(screen.getByText('Agent traces')).toBeInTheDocument()
    expect(screen.getAllByRole('option', { name: /llm\.generate/ }).length).toBeGreaterThan(1)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('replays Maya from a local audio fixture without fetching TTS', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined)

    render(<ChatDemo />)
    fireEvent.click(screen.getByRole('radio', { name: 'Group chat TTS' }))
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }))
    act(() => vi.advanceTimersByTime(5000))

    const replayMaya = screen.getByRole('button', { name: 'Replay Maya' })
    expect(document.querySelector('[data-chat-part="audio"]')).toBeInTheDocument()
    expect(screen.getByText(/I'm Jordan/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Replay Jordan' })).toBeInTheDocument()
    expect(screen.getByText('Agent traces')).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Trace waterfall' })).toBeInTheDocument()
    expect(screen.getAllByRole('option', { name: /llm\.generate/ }).length).toBeGreaterThan(1)

    fireEvent.click(replayMaya)

    expect(replayMaya).toHaveAttribute('aria-pressed', 'true')
    expect(play).toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(screen.getByRole('option', { name: /tts\.replay/ })).toBeInTheDocument()

    play.mockRestore()
  })
})
