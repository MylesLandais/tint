import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AudioPlayer } from './AudioPlayer'

describe('AudioPlayer', () => {
  it('renders the compact track metadata without enabling the optional shadow', () => {
    const { container } = render(
      <AudioPlayer
        src="reverberation.mp3"
        label="Reverberation by Substance & Vainqueur"
        title="Reverberation"
        artist="Substance & Vainqueur"
        duration={855}
      />,
    )

    expect(screen.getByText('Reverberation')).toBeInTheDocument()
    expect(screen.getByText('Substance & Vainqueur')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play reverberation/i })).toBeEnabled()
    expect(container.querySelector('[data-tint-audio-player]')).not.toHaveAttribute('data-shadow')
  })

  it('opts into the reference shadow and renders supplied artwork', () => {
    const { container } = render(
      <AudioPlayer
        src="track.mp3"
        label="Track"
        artwork="cover.jpg"
        artworkAlt="Monochrome album cover"
        shadow
      />,
    )

    expect(screen.getByRole('img', { name: 'Monochrome album cover' })).toHaveAttribute(
      'src',
      'cover.jpg',
    )
    expect(container.querySelector('[data-tint-audio-player]')).toHaveAttribute(
      'data-shadow',
      'offset',
    )
  })

  it('only exposes playlist controls when their callbacks are supplied', () => {
    const onPrevious = vi.fn()
    const onNext = vi.fn()
    render(
      <AudioPlayer
        src="track.mp3"
        label="Track"
        title="Track"
        onPrevious={onPrevious}
        onNext={onNext}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Previous track before Track' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next track after Track' }))

    expect(onPrevious).toHaveBeenCalledOnce()
    expect(onNext).toHaveBeenCalledOnce()
  })

  it('shows elapsed and remaining time from media events', () => {
    const { container } = render(<AudioPlayer src="track.mp3" label="Track" duration={180} />)
    const audio = container.querySelector('audio')
    if (!audio) throw new Error('Expected the audio element')

    Object.defineProperty(audio, 'currentTime', { configurable: true, value: 30 })
    fireEvent.timeUpdate(audio)

    expect(screen.getByText('0:30')).toBeInTheDocument()
    expect(screen.getByText('-2:30')).toBeInTheDocument()
  })
})
