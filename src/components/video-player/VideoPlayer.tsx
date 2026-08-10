import { useEffect, useMemo, useRef, useState, type VideoHTMLAttributes } from 'react'
import { Maximize, Minimize, Settings } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/utils'
import { Icon } from '../icon'
import { SettingsPopout, type SettingsPopoutItem } from '../settings-popout'
import { Slider, VolumeControl, formatTime } from '../media'
import {
  FULLSCREEN_EVENTS,
  exitElementFullscreen,
  getFullscreenElement,
  requestElementFullscreen,
} from './fullscreen'

const DEFAULT_PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const

export type VideoPlayerProps = {
  src: string
  poster?: string
  className?: string
  autoHideControls?: boolean
  label?: string
  /** Visible title, shown above the timeline. Falls back to `label`. */
  title?: string
  duration?: number
  playbackSpeeds?: readonly number[]
  size?: 'sm' | 'md' | 'lg'
  shadow?: boolean
  onPlay?: () => void
  onPause?: () => void
} & Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src' | 'poster' | 'className' | 'controls' | 'onPlay' | 'onPause'>

export function VideoPlayer({
  src,
  poster,
  className,
  autoHideControls = true,
  label = 'Video',
  title = label,
  duration: durationHint,
  playbackSpeeds = DEFAULT_PLAYBACK_SPEEDS,
  size,
  shadow = false,
  onPlay,
  onPause,
  ...videoProps
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showControls, setShowControls] = useState(!autoHideControls)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [volumeOpen, setVolumeOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(durationHint ?? 0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  /** In-page theater mode when the Fullscreen API is blocked or unavailable. */
  const [theaterMode, setTheaterMode] = useState(false)

  useEffect(() => {
    const onFullscreenChange = () => {
      const active = getFullscreenElement() === containerRef.current
      setIsFullscreen(active || theaterMode)
      if (active) setTheaterMode(false)
    }
    for (const eventName of FULLSCREEN_EVENTS) {
      document.addEventListener(eventName, onFullscreenChange)
    }
    return () => {
      for (const eventName of FULLSCREEN_EVENTS) {
        document.removeEventListener(eventName, onFullscreenChange)
      }
    }
  }, [theaterMode])

  useEffect(() => {
    if (!theaterMode) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTheaterMode(false)
        setIsFullscreen(false)
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [theaterMode])

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    const apiActive = getFullscreenElement() === container
    if (apiActive || theaterMode) {
      if (apiActive) void exitElementFullscreen().catch(() => undefined)
      setTheaterMode(false)
      setIsFullscreen(false)
      return
    }

    // Fullscreen the container (not the raw <video>) so the custom control bar
    // stays available — native video fullscreen would replace it.
    void requestElementFullscreen(container).catch(() => {
      setTheaterMode(true)
      setIsFullscreen(true)
    })
  }

  const settingsItems = useMemo<SettingsPopoutItem[]>(
    () => playbackSpeeds.map((speed) => ({
      id: `speed-${speed}`,
      label: `${speed}x`,
      group: 'Playback speed',
      description: `Play at ${speed} times normal speed`,
    })),
    [playbackSpeeds],
  )

  useEffect(() => {
    setShowControls(!autoHideControls)
  }, [autoHideControls])

  useEffect(() => {
    setCurrentTime(0)
    setProgress(0)
    setDuration(durationHint ?? 0)
    setIsPlaying(false)
  }, [src, durationHint])

  const updateTime = () => {
    const video = videoRef.current
    if (!video) return
    const nextDuration = Number.isFinite(video.duration) ? video.duration : duration
    if (nextDuration > 0) {
      setDuration(nextDuration)
      setProgress(Math.min((video.currentTime / nextDuration) * 100, 100))
    }
    setCurrentTime(video.currentTime)
  }

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      await video.play()
    } else {
      video.pause()
    }
  }

  const handleVolumeChange = (value: number) => {
    const video = videoRef.current
    if (!video) return
    const nextVolume = value / 100
    video.volume = nextVolume
    video.muted = nextVolume === 0
    setVolume(nextVolume)
    setIsMuted(nextVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    if (isMuted || volume === 0) {
      const restored = volume === 0 ? 1 : volume
      video.muted = false
      video.volume = restored
      setVolume(restored)
      setIsMuted(false)
    } else {
      video.muted = true
      setIsMuted(true)
    }
  }

  const handleSeek = (value: number) => {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
    video.currentTime = (value / 100) * video.duration
    setProgress(value)
  }

  const setSpeed = (speed: number) => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = speed
    setPlaybackSpeed(speed)
  }

  const overlayOpen = settingsOpen || volumeOpen
  const revealControls = () => { if (autoHideControls) setShowControls(true) }
  const maybeHideControls = () => { if (autoHideControls && !overlayOpen) setShowControls(false) }

  return (
    <motion.div
      ref={containerRef}
      data-tint-video-player=""
      data-size={size}
      data-fullscreen={isFullscreen ? 'true' : 'false'}
      data-theater={theaterMode ? 'true' : 'false'}
      className={cn(
        'relative mx-auto w-full rounded-lg bg-tint-chrome shadow-[0_0_20px_var(--tint-shadow-color)] backdrop-blur-sm',
        !isFullscreen && (size === 'sm' ? 'max-w-xl' : size === 'md' ? 'max-w-3xl' : 'max-w-4xl'),
        shadow && !isFullscreen && 'shadow-[6px_6px_0_var(--tint-shadow-color)]',
        theaterMode &&
          'fixed inset-0 z-50 m-0 h-dvh max-h-dvh w-screen max-w-none rounded-none shadow-none',
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={revealControls}
      onMouseLeave={maybeHideControls}
      onFocusCapture={revealControls}
      onBlurCapture={(event) => {
        if (autoHideControls && !overlayOpen && !event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setShowControls(false)
        }
      }}
    >
      <video
        ref={videoRef}
        className={cn(
          'w-full cursor-pointer bg-black',
          isFullscreen ? 'h-full rounded-none object-contain' : 'rounded-lg',
        )}
        src={src}
        poster={poster}
        {...videoProps}
        aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
        onClick={() => void togglePlay()}
        onTimeUpdate={updateTime}
        onLoadedMetadata={updateTime}
        onPlay={() => { setIsPlaying(true); onPlay?.() }}
        onPause={() => { setIsPlaying(false); onPause?.() }}
        onEnded={() => setIsPlaying(false)}
      />

      <AnimatePresence>
        {showControls ? (
          <motion.div
            className="absolute bottom-3 left-1/2 z-20 flex w-2/3 max-w-xl -translate-x-1/2 flex-col gap-2 rounded-xl bg-tint-chrome px-3 pt-2.5 pb-2.5 backdrop-blur-md"
            initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.45, ease: 'circInOut', type: 'spring' }}
          >
            <p className="m-0 truncate text-xs font-medium text-tint-chrome-ink/85">{title}</p>

            <div className="flex items-center gap-2 text-tint-chrome-ink">
              <span className="min-w-9 text-xs tabular-nums">{formatTime(currentTime)}</span>
              <Slider value={progress} onChange={handleSeek} className="flex-1 text-tint-chrome-ink" aria-label={`Seek ${label}`} />
              <span className="min-w-9 text-right text-xs tabular-nums">{formatTime(duration)}</span>
              <div className="flex items-center gap-0.5">
                <VolumeControl
                  volume={volume}
                  isMuted={isMuted}
                  onVolumeChange={handleVolumeChange}
                  onToggleMute={toggleMute}
                  onOpenChange={(open) => { if (open) setSettingsOpen(false); setVolumeOpen(open) }}
                />
                <div className="relative">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => { setVolumeOpen(false); setSettingsOpen((open) => !open) }}
                    aria-label="Settings"
                    aria-haspopup="dialog"
                    aria-expanded={settingsOpen}
                    className={cn('inline-flex size-8 items-center justify-center rounded-md text-tint-chrome-ink transition-colors hover:bg-tint-chrome-ink/12', settingsOpen && 'bg-tint-chrome-ink/12')}
                  >
                    <Icon icon={Settings} size="sm" />
                  </motion.button>
                  <SettingsPopout
                    isOpen={settingsOpen}
                    onOpenChange={setSettingsOpen}
                    items={settingsItems}
                    value={`speed-${playbackSpeed}`}
                    onSelect={(id) => { const speed = Number(id.replace('speed-', '')); if (Number.isFinite(speed)) setSpeed(speed) }}
                    label="Player settings"
                    placeholder="Search settings…"
                  />
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  className="inline-flex size-8 items-center justify-center rounded-md text-tint-chrome-ink transition-colors hover:bg-tint-chrome-ink/12"
                >
                  <Icon icon={isFullscreen ? Minimize : Maximize} size="sm" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}

export default VideoPlayer
