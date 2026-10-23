import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MediaPlayer from './MediaPlayer.svelte'

afterEach(() => vi.restoreAllMocks())

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

  it('replaces source elements and qualifies errors by their owned source', async () => {
    const onError = vi.fn()
    const view = render(MediaPlayer, { kind: 'audio', src: 'first.wav', label: 'Preview', preload: 'none', onError })
    const first = view.container.querySelector('audio')!
    expect(first).toHaveAttribute('preload', 'none')
    await view.rerender({ kind: 'audio', src: 'second.wav', label: 'Preview', preload: 'none', onError })
    const second = view.container.querySelector('audio')!
    expect(first).not.toBe(second)
    await fireEvent.error(first)
    expect(onError).not.toHaveBeenCalled()
    await fireEvent.error(second); await fireEvent.error(second)
    expect(onError).toHaveBeenCalledExactlyOnceWith('second.wav')
  })

  it('applies fresh source-bound chapter seeks once and ignores stale or reused requests', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    const props = { kind: 'audio' as const, src: 'chapter.wav', label: 'Chapter', duration: 60 }
    const view = render(MediaPlayer, { ...props, seekRequest: { id: 'first', src: 'chapter.wav', positionSeconds: 12, play: true } })
    const audio = view.container.querySelector('audio')!
    await waitFor(() => expect(audio.currentTime).toBe(12))
    expect(play).toHaveBeenCalledTimes(1)
    await view.rerender({ ...props, seekRequest: { id: 'first', src: 'chapter.wav', positionSeconds: 30, play: true } })
    expect(audio.currentTime).toBe(12)
    await view.rerender({ ...props, seekRequest: { id: 'second', src: 'chapter.wav', positionSeconds: 20 } })
    expect(audio.currentTime).toBe(20)
    await view.rerender({ ...props, src: 'other.wav', seekRequest: { id: 'second', src: 'chapter.wav', positionSeconds: 20, play: true } })
    expect(view.container.querySelector('audio')!.currentTime).toBe(0)
    expect(play).toHaveBeenCalledTimes(1)
  })

  it('does not defer mismatched or remote seek requests into a later local source', async () => {
    const props = { kind: 'audio' as const, src: 'current.wav', label: 'Track' }
    const view = render(MediaPlayer, { ...props, seekRequest: { id: 'stale', src: 'old.wav', positionSeconds: 12 } })
    await view.rerender({ ...props, src: 'old.wav', seekRequest: { id: 'stale', src: 'old.wav', positionSeconds: 12 } })
    expect(view.container.querySelector('audio')!.currentTime).toBe(0)
    const remote = { playing: false, currentTime: 0, duration: 60, volume: 1, onPlay: vi.fn(), onPause: vi.fn(), onSeek: vi.fn(), onVolumeChange: vi.fn() }
    await view.rerender({ ...props, remote, seekRequest: { id: 'remote', src: 'current.wav', positionSeconds: 20 } })
    await view.rerender({ ...props, remote: undefined, seekRequest: { id: 'remote', src: 'current.wav', positionSeconds: 20 } })
    expect(view.container.querySelector('audio')!.currentTime).toBe(0)
    expect(remote.onSeek).not.toHaveBeenCalled()
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
