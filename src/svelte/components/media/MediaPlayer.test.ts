import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import MediaPlayer from './MediaPlayer.svelte'

describe('Svelte MediaPlayer', () => {
  it('renders controlled audio metadata and derives elapsed time from media events', async () => {
    const { container } = render(MediaPlayer, {
      kind: 'audio', src: 'track.mp3', label: 'Track', artist: 'Artist', duration: 180, size: 'sm',
    })
    expect(screen.getByText('Artist')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play Track' })).toBeEnabled()
    expect(container.querySelector('[data-tint-media-player]')).toHaveAttribute('data-size', 'sm')
    const audio = container.querySelector('audio')!
    Object.defineProperty(audio, 'currentTime', { configurable: true, value: 30, writable: true })
    await fireEvent.timeUpdate(audio)
    expect(screen.getByText('0:30')).toBeInTheDocument()
    expect(screen.getByText('-2:30')).toBeInTheDocument()
  })

  it('emits optional previous and next intent and falls back from failed artwork', async () => {
    const onPrevious = vi.fn()
    const onNext = vi.fn()
    const { container } = render(MediaPlayer, {
      kind: 'audio', src: 'track.mp3', label: 'Track', artwork: 'missing.jpg', onPrevious, onNext,
    })
    await fireEvent.click(screen.getByRole('button', { name: 'Previous track before Track' }))
    await fireEvent.click(screen.getByRole('button', { name: 'Next track after Track' }))
    expect(onPrevious).toHaveBeenCalledOnce()
    expect(onNext).toHaveBeenCalledOnce()
    await fireEvent.error(container.querySelector('.artwork img')!)
    expect(container.querySelector('.artwork img')).not.toBeInTheDocument()
    expect(container.querySelector('.artwork svg')).toBeInTheDocument()
  })

  it('uses the remote controller as the authority for audio transport and seek', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    const onPause = vi.fn()
    const onSeek = vi.fn()
    render(MediaPlayer, {
      kind: 'audio', src: '/api/output.wav', label: 'Remote track',
      remote: { playing: true, currentTime: 42, duration: 180, volume: .7, onPlay: vi.fn(), onPause, onSeek, onVolumeChange: vi.fn() },
    })
    expect(screen.getByText('0:42')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Pause Remote track' }))
    expect(onPause).toHaveBeenCalledOnce()
    expect(play).toHaveBeenCalled()
    play.mockRestore()
    pause.mockRestore()
  })

  it('renders video and updates the keyboard transport from native events', async () => {
    const { container } = render(MediaPlayer, {
      kind: 'video', src: 'clip.mp4', label: 'Clip', poster: 'poster.jpg', autoHideControls: false,
    })
    const video = container.querySelector('video')!
    expect(video).toHaveAttribute('poster', 'poster.jpg')
    expect(screen.getByRole('button', { name: 'Play Clip' })).toBeInTheDocument()
    await fireEvent.play(video)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pause Clip' })).toBeInTheDocument())
    await fireEvent.pause(video)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Play Clip' })).toBeInTheDocument())
  })

  it('renders host-provided caption and subtitle tracks', () => {
    const { container } = render(MediaPlayer, {
      kind: 'video', src: 'clip.mp4', label: 'Clip',
      tracks: [
        { src: 'clip.en.vtt', kind: 'captions', srcLang: 'en', label: 'English captions', default: true },
        { src: 'clip.es.vtt', kind: 'subtitles', srcLang: 'es', label: 'Español' },
      ],
    })
    const tracks = container.querySelectorAll('video track')
    expect(tracks).toHaveLength(2)
    expect(tracks[0]).toHaveAttribute('kind', 'captions')
    expect(tracks[0]).toHaveAttribute('srclang', 'en')
    expect(tracks[0]).toHaveAttribute('default')
    expect(tracks[1]).toHaveAttribute('kind', 'subtitles')
    expect(tracks[1]).toHaveAttribute('srclang', 'es')
  })

  it('can swap between audio and video kinds on one mounted entry point', async () => {
    const { container, rerender } = render(MediaPlayer, { kind: 'audio', src: 'track.mp3', label: 'Track' })
    expect(container.querySelector('audio')).toBeInTheDocument()
    await rerender({ kind: 'video', src: 'clip.mp4', label: 'Clip', autoHideControls: false })
    expect(container.querySelector('video')).toBeInTheDocument()
    await rerender({ kind: 'audio', src: 'track.mp3', label: 'Track' })
    expect(container.querySelector('audio')).toBeInTheDocument()
  })
})
