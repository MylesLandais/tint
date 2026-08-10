import { useEffect, useState, type RefObject, type SyntheticEvent } from 'react'

export type MediaPlaybackState = {
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  buffering: boolean
  failed: boolean
}

export type MediaPlaybackActions = {
  toggle: () => void
  seek: (percentage: number) => void
  changeVolume: (percentage: number) => void
  toggleMute: () => void
}

export type MediaEventHandlers = {
  onLoadedMetadata: (event: SyntheticEvent<HTMLMediaElement>) => void
  onDurationChange: (event: SyntheticEvent<HTMLMediaElement>) => void
  onTimeUpdate: (event: SyntheticEvent<HTMLMediaElement>) => void
  onPlay: () => void
  onPause: () => void
  onEnded: () => void
  onWaiting: () => void
  onPlaying: () => void
  onCanPlay: () => void
  onError: () => void
}

export type UseMediaPlaybackOptions = {
  src: string
  durationHint?: number
  onPlay?: () => void
  onPause?: () => void
}

/**
 * Shared playback engine for `<audio>` and `<video>`: both extend
 * `HTMLMediaElement` with an identical event/property surface, so one state
 * machine drives either. Has no notion of `kind` — the caller mounts
 * whichever element type it needs against `mediaRef` and wires
 * `mediaEventHandlers` to it; the chrome around it decides what to render.
 */
export function useMediaPlayback(
  mediaRef: RefObject<HTMLMediaElement | null>,
  { src, durationHint, onPlay, onPause }: UseMediaPlaybackOptions,
): { state: MediaPlaybackState; actions: MediaPlaybackActions; mediaEventHandlers: MediaEventHandlers } {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(durationHint ?? 0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [failed, setFailed] = useState(false)

  // A new source is a new clip: drop the old clip's progress and error state.
  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(durationHint ?? 0)
    setBuffering(false)
    setFailed(false)
  }, [src, durationHint])

  const seek = (percentage: number) => {
    const media = mediaRef.current
    if (!media || !Number.isFinite(duration) || duration <= 0) return
    const next = (percentage / 100) * duration
    media.currentTime = next
    setCurrentTime(next)
  }

  const toggle = () => {
    const media = mediaRef.current
    if (!media || failed) return
    if (!media.paused) {
      media.pause()
      return
    }
    // `play()` rejects on autoplay policy or a bad source; either way the UI
    // must not be left claiming it is playing.
    void Promise.resolve(media.play()).catch(() => {
      setBuffering(false)
      setFailed(true)
    })
  }

  const changeVolume = (percentage: number) => {
    const level = percentage / 100
    setVolume(level)
    setMuted(level === 0)
    const media = mediaRef.current
    if (media) {
      media.volume = level
      media.muted = level === 0
    }
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    const media = mediaRef.current
    if (media) media.muted = next
  }

  const readDuration = (event: SyntheticEvent<HTMLMediaElement>) => {
    const next = event.currentTarget.duration
    if (Number.isFinite(next)) setDuration(next)
  }

  return {
    state: { playing, currentTime, duration, volume, muted, buffering, failed },
    actions: { toggle, seek, changeVolume, toggleMute },
    mediaEventHandlers: {
      onLoadedMetadata: readDuration,
      onDurationChange: readDuration,
      onTimeUpdate: (event) => setCurrentTime(event.currentTarget.currentTime),
      onPlay: () => {
        setPlaying(true)
        setBuffering(false)
        onPlay?.()
      },
      onPause: () => {
        setPlaying(false)
        setBuffering(false)
        onPause?.()
      },
      onEnded: () => {
        setPlaying(false)
        setCurrentTime(0)
      },
      onWaiting: () => setBuffering(true),
      onPlaying: () => setBuffering(false),
      onCanPlay: () => setBuffering(false),
      onError: () => {
        setBuffering(false)
        setFailed(true)
        setPlaying(false)
      },
    },
  }
}
