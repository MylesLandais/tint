import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MediaPlayer } from './MediaPlayer'

describe('MediaPlayer (audio)', () => {
  it('renders the compact track metadata without enabling the optional shadow', () => {
    const { container } = render(
      <MediaPlayer
        kind="audio"
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
    expect(container.querySelector('[data-tint-media-player]')).not.toHaveAttribute('data-shadow')
  })

  it('opts into the reference shadow and renders supplied artwork', () => {
    const { container } = render(
      <MediaPlayer
        kind="audio"
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
    expect(container.querySelector('[data-tint-media-player]')).toHaveAttribute(
      'data-shadow',
      'offset',
    )
  })

  it('only exposes playlist controls when their callbacks are supplied', () => {
    const onPrevious = vi.fn()
    const onNext = vi.fn()
    render(
      <MediaPlayer
        kind="audio"
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
    const { container } = render(
      <MediaPlayer kind="audio" src="track.mp3" label="Track" duration={180} />,
    )
    const audio = container.querySelector('audio')
    if (!audio) throw new Error('Expected the audio element')

    Object.defineProperty(audio, 'currentTime', { configurable: true, value: 30 })
    fireEvent.timeUpdate(audio)

    expect(screen.getByText('0:30')).toBeInTheDocument()
    expect(screen.getByText('-2:30')).toBeInTheDocument()
  })

  it('renders the white-label placeholder when no artwork is supplied', () => {
    const { container } = render(<MediaPlayer kind="audio" src="track.mp3" label="Track" />)

    expect(container.querySelector('[data-media-surface] img')).not.toBeInTheDocument()
    expect(container.querySelector('[data-media-surface] svg')).toBeInTheDocument()
  })

  it('falls back to the placeholder when the artwork fails to load', () => {
    const { container } = render(
      <MediaPlayer kind="audio" src="track.mp3" label="Track" artwork="missing.jpg" />,
    )

    const img = container.querySelector('[data-media-surface] img')
    if (!img) throw new Error('Expected the artwork image')
    fireEvent.error(img)

    expect(container.querySelector('[data-media-surface] img')).not.toBeInTheDocument()
    expect(container.querySelector('[data-media-surface] svg')).toBeInTheDocument()
  })

  it('renders a canvas waveform behind the scrubber and seeks on click', () => {
    const { container } = render(
      <MediaPlayer
        kind="audio"
        src="track.mp3"
        label="Track"
        duration={100}
        waveform={[1, 4, 8, 2, 6]}
      />,
    )

    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('aria-hidden', 'true')
  })

  it('reflects an explicit size prop as a data-size attribute', () => {
    const { container, rerender } = render(
      <MediaPlayer kind="audio" src="track.mp3" label="Track" size="sm" />,
    )
    expect(container.querySelector('[data-tint-media-player]')).toHaveAttribute('data-size', 'sm')

    rerender(<MediaPlayer kind="audio" src="track.mp3" label="Track" />)
    expect(container.querySelector('[data-tint-media-player]')).not.toHaveAttribute('data-size')
  })
})

describe('MediaPlayer (video)', () => {
  it('renders a video element with the accessible label', () => {
    const { container } = render(
      <MediaPlayer kind="video" src="clip.mp4" label="Product walkthrough" />,
    )

    const video = container.querySelector('video')
    expect(video).toHaveAttribute('src', 'clip.mp4')
    expect(video).toHaveAttribute('aria-label', 'Play Product walkthrough')
  })

  it('toggles play/pause state from media events', () => {
    const { container } = render(<MediaPlayer kind="video" src="clip.mp4" label="Clip" autoHideControls={false} />)
    const video = container.querySelector('video')
    if (!video) throw new Error('Expected the video element')

    fireEvent.play(video)
    expect(video).toHaveAttribute('aria-label', 'Pause Clip')

    fireEvent.pause(video)
    expect(video).toHaveAttribute('aria-label', 'Play Clip')
  })

  it('keeps the original video surface when the source errors', () => {
    const { container } = render(<MediaPlayer kind="video" src="clip.mp4" label="Clip" />)
    const video = container.querySelector('video')
    if (!video) throw new Error('Expected the video element')

    fireEvent.error(video)

    expect(container.querySelector('[data-tint-video-player]')).toBeInTheDocument()
  })

  it('uses the immersive video surface before playback starts', () => {
    const { container } = render(<MediaPlayer kind="video" src="clip.mp4" label="Clip" />)
    expect(container.querySelector('[data-tint-video-player] video')).toBeInTheDocument()
  })

  it('passes posters through to the restored video surface', () => {
    const { container } = render(
      <MediaPlayer kind="video" src="clip.mp4" label="Clip" poster="poster.jpg" />,
    )
    expect(container.querySelector('video')).toHaveAttribute('poster', 'poster.jpg')
  })
})
