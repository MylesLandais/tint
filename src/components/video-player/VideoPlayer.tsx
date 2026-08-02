import { useEffect, useMemo, useRef, useState, type VideoHTMLAttributes } from 'react'
import { Settings, Volume1, Volume2, VolumeX } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { SettingsPopout, type SettingsPopoutItem } from '@/components/settings-popout'

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const

export type VideoPlayerProps = {
  /** Video source URL */
  src: string
  /** Optional poster image shown before playback */
  poster?: string
  /** Additional class names for the root container */
  className?: string
  /** Hide the animated control bar until hover/focus */
  autoHideControls?: boolean
  /** Called when playback starts */
  onPlay?: () => void
  /** Called when playback pauses */
  onPause?: () => void
} & Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src' | 'poster' | 'className' | 'controls'>

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

type SliderProps = {
  value: number
  onChange: (value: number) => void
  className?: string
  'aria-label': string
}

function Slider({ value, onChange, className, 'aria-label': ariaLabel }: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const updateFromClientX = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const percentage = ((clientX - rect.left) / rect.width) * 100
    onChange(Math.min(Math.max(percentage, 0), 100))
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value)}
      className={cn(
        'relative h-1 w-full cursor-pointer rounded-full bg-white/20 outline-none focus-visible:ring-2 focus-visible:ring-white/60',
        className,
      )}
      onClick={(event) => updateFromClientX(event.clientX)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault()
          onChange(Math.min(value + 5, 100))
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault()
          onChange(Math.max(value - 5, 0))
        }
      }}
    >
      <motion.div
        className="absolute top-0 left-0 h-full rounded-full bg-white"
        initial={false}
        animate={{ width: `${value}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </div>
  )
}

export function VideoPlayer({
  src,
  poster,
  className,
  autoHideControls = true,
  onPlay,
  onPause,
  ...videoProps
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showControls, setShowControls] = useState(!autoHideControls)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const settingsItems = useMemo<SettingsPopoutItem[]>(
    () =>
      PLAYBACK_SPEEDS.map((speed) => ({
        id: `speed-${speed}`,
        label: `${speed}x`,
        group: 'Playback speed',
        description: `Play at ${speed} times normal speed`,
      })),
    [],
  )

  useEffect(() => {
    if (!autoHideControls) {
      setShowControls(true)
    }
  }, [autoHideControls])

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      await video.play()
      setIsPlaying(true)
      onPlay?.()
    } else {
      video.pause()
      setIsPlaying(false)
      onPause?.()
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

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || !video.duration) return
    const nextProgress = (video.currentTime / video.duration) * 100
    setProgress(Number.isFinite(nextProgress) ? nextProgress : 0)
    setCurrentTime(video.currentTime)
    setDuration(video.duration)
  }

  const handleSeek = (value: number) => {
    const video = videoRef.current
    if (!video || !video.duration) return
    const time = (value / 100) * video.duration
    if (!Number.isFinite(time)) return
    video.currentTime = time
    setProgress(value)
  }

  const toggleMute = () => {
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
  }

  const setSpeed = (speed: number) => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = speed
    setPlaybackSpeed(speed)
  }

  const handleSettingsSelect = (id: string) => {
    if (!id.startsWith('speed-')) return
    const speed = Number(id.replace('speed-', ''))
    if (!Number.isFinite(speed)) return
    setSpeed(speed)
  }

  const revealControls = () => {
    if (autoHideControls) setShowControls(true)
  }

  const maybeHideControls = () => {
    if (autoHideControls && !settingsOpen) {
      setShowControls(false)
    }
  }

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume > 0.5 ? Volume2 : Volume1

  return (
    <motion.div
      className={cn(
        'relative mx-auto w-full max-w-4xl rounded-xl bg-[#11111198] shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm',
        className,
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onMouseEnter={revealControls}
      onMouseLeave={maybeHideControls}
      onFocusCapture={revealControls}
      onBlurCapture={(event) => {
        if (
          autoHideControls &&
          !settingsOpen &&
          !event.currentTarget.contains(event.relatedTarget as Node | null)
        ) {
          setShowControls(false)
        }
      }}
    >
      <video
        ref={videoRef}
        className="w-full cursor-pointer rounded-xl bg-black"
        src={src}
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleTimeUpdate}
        onPlay={() => {
          setIsPlaying(true)
          onPlay?.()
        }}
        onPause={() => {
          setIsPlaying(false)
          onPause?.()
        }}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause video' : 'Play video'}
        {...videoProps}
      />

      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute right-0 bottom-0 left-0 z-20 m-2 mx-auto max-w-xl rounded-2xl bg-[#11111198] p-4 backdrop-blur-md"
            initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.45, ease: 'circInOut', type: 'spring' }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="min-w-10 text-sm text-white tabular-nums">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={progress}
                onChange={handleSeek}
                className="flex-1"
                aria-label="Seek"
              />
              <span className="min-w-10 text-right text-sm text-white tabular-nums">
                {formatTime(duration)}
              </span>
            </div>

            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={toggleMute}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-[#111111d1]"
                >
                  <VolumeIcon className="size-5" />
                </motion.button>
                <div className="w-24">
                  <Slider
                    value={isMuted ? 0 : volume * 100}
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                  />
                </div>
              </div>

              <div className="relative">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSettingsOpen((open) => !open)}
                  aria-label="Settings"
                  aria-haspopup="dialog"
                  aria-expanded={settingsOpen}
                  className={cn(
                    'inline-flex size-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-[#111111d1]',
                    settingsOpen && 'bg-[#111111d1]',
                  )}
                >
                  <Settings className="size-5" />
                </motion.button>

                <SettingsPopout
                  isOpen={settingsOpen}
                  onOpenChange={setSettingsOpen}
                  items={settingsItems}
                  value={`speed-${playbackSpeed}`}
                  onSelect={handleSettingsSelect}
                  label="Player settings"
                  placeholder="Search settings…"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default VideoPlayer
