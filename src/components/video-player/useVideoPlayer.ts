import {
  useCallback,
  useState,
  type DOMAttributes,
  type RefObject,
} from 'react'
import { useLatestRef } from '@/lib/useLatestRef'

export type UseVideoPlayerOptions = {
  /** Called when playback starts. */
  onPlay?: () => void
  /** Called when playback pauses. */
  onPause?: () => void
}

export type VideoPlayerControls = {
  isPlaying: boolean
  /** Current volume in the 0–1 range mirrored from the media element. */
  volume: number
  isMuted: boolean
  playbackSpeed: number
  /** Current playback position in seconds. */
  currentTime: number
  /** Media duration in seconds (0 until metadata loads). */
  duration: number
  /** Playback progress as a 0–100 percentage, derived from time/duration. */
  progress: number
  togglePlay: () => void
  /** Seek to a 0–100 percentage of the duration. */
  seek: (percent: number) => void
  /** Set volume from a 0–100 percentage. */
  changeVolume: (percent: number) => void
  toggleMute: () => void
  setSpeed: (speed: number) => void
  /** Spread onto the underlying `<video>` element to keep state in sync. */
  mediaHandlers: Pick<
    DOMAttributes<HTMLVideoElement>,
    'onPlay' | 'onPause' | 'onEnded' | 'onTimeUpdate' | 'onLoadedMetadata' | 'onDurationChange'
  >
}

/**
 * Headless playback controller for a `<video>` element. Owns the player state
 * and exposes imperative controls plus handlers to bind to the element, so the
 * same logic can back any presentation in the design system.
 *
 * The media element's own events are the single source of truth for
 * play/pause: `togglePlay` only calls `play()`/`pause()` and lets the resulting
 * `play`/`pause` events drive state and the `onPlay`/`onPause` callbacks. This
 * avoids firing consumer callbacks twice per toggle.
 */
export function useVideoPlayer(
  videoRef: RefObject<HTMLVideoElement | null>,
  { onPlay, onPause }: UseVideoPlayerOptions = {},
): VideoPlayerControls {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const callbacksRef = useLatestRef({ onPlay, onPause })

  const progress =
    duration > 0 ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      // play() can reject (e.g. autoplay policy); swallow to avoid an
      // unhandled rejection. State follows the emitted `play` event.
      void video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [videoRef])

  const seek = useCallback(
    (percent: number) => {
      const video = videoRef.current
      if (!video || !video.duration) return
      const time = (percent / 100) * video.duration
      if (!Number.isFinite(time)) return
      video.currentTime = time
      setCurrentTime(time)
    },
    [videoRef],
  )

  const changeVolume = useCallback(
    (percent: number) => {
      const video = videoRef.current
      if (!video) return
      const nextVolume = percent / 100
      video.volume = nextVolume
      video.muted = nextVolume === 0
      setVolume(nextVolume)
      setIsMuted(nextVolume === 0)
    },
    [videoRef],
  )

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (isMuted || volume === 0) {
      const restored = volume === 0 ? 1 : volume
      video.muted = false
      video.volume = restored
      setIsMuted(false)
      setVolume(restored)
      return
    }

    video.muted = true
    setIsMuted(true)
  }, [videoRef, isMuted, volume])

  const setSpeed = useCallback(
    (speed: number) => {
      const video = videoRef.current
      if (!video) return
      video.playbackRate = speed
      setPlaybackSpeed(speed)
    },
    [videoRef],
  )

  const mediaHandlers: VideoPlayerControls['mediaHandlers'] = {
    onPlay: () => {
      setIsPlaying(true)
      callbacksRef.current.onPlay?.()
    },
    onPause: () => {
      setIsPlaying(false)
      callbacksRef.current.onPause?.()
    },
    onEnded: () => setIsPlaying(false),
    onTimeUpdate: (event) => setCurrentTime(event.currentTarget.currentTime),
    onLoadedMetadata: (event) => {
      setDuration(event.currentTarget.duration)
      setCurrentTime(event.currentTarget.currentTime)
    },
    onDurationChange: (event) => setDuration(event.currentTarget.duration),
  }

  return {
    isPlaying,
    volume,
    isMuted,
    playbackSpeed,
    currentTime,
    duration,
    progress,
    togglePlay,
    seek,
    changeVolume,
    toggleMute,
    setSpeed,
    mediaHandlers,
  }
}
