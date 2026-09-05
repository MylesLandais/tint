import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Midnight128BrowserDemo } from './Midnight128BrowserDemo'

describe('Midnight128BrowserDemo', () => {
  it('renders the visible import workflow without eagerly constructing AudioContext', () => {
    const AudioContext = vi.fn(function AudioContext() {})
    render(<Midnight128BrowserDemo environment={{
      AudioContext: AudioContext as unknown as typeof globalThis.AudioContext,
    }} />)
    expect(screen.getByRole('dialog', { name: 'Import local tracks' })).toBeInTheDocument()
    expect(screen.getByLabelText('Choose audio files')).toHaveAttribute('multiple')
    expect(AudioContext).not.toHaveBeenCalled()
  })
})
