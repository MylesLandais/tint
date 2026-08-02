import { useEffect, useMemo, useRef, useState, type VideoHTMLAttributes } from 'react'
import { Settings } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { SettingsPopout, type SettingsPopoutItem } from '@/components/settings-popout'
import { Slider } from './Slider'
import { VolumeControl } from './VolumeControl'

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
  const [volumeOpen, setVolumeOpen] = useState(false)
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

  const overlayOpen = settingsOpen || volumeOpen

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
    if (autoHideControls && !overlayOpen) {
      setShowControls(false)
    }
  }

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
          !overlayOpen &&
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
            className="absolute right-0 bottom-0 left-0 z-20 m-2 mx-auto max-w-xl rounded-2xl bg-[#11111198] px-3 py-2.5 backdrop-blur-md"
            initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 0.45, ease: 'circInOut', type: 'spring' }}
          >
            <div className="flex items-center gap-2">
              <span className="min-w-9 text-xs text-white tabular-nums">
                {formatTime(currentTime)}
              </span>

              <Slider
                value={progress}
                onChange={handleSeek}
                className="flex-1"
                aria-label="Seek"
              />

              <span className="min-w-9 text-right text-xs text-white tabular-nums">
                {formatTime(duration)}
              </span>

              <div className="flex items-center gap-0.5">
                <VolumeControl
                  volume={volume}
                  isMuted={isMuted}
                  onVolumeChange={handleVolumeChange}
                  onToggleMute={toggleMute}
                  onOpenChange={(open) => {
                    if (open) setSettingsOpen(false)
                    setVolumeOpen(open)
                  }}
                />

                <div className="relative">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      setVolumeOpen(false)
                      setSettingsOpen((open) => !open)
                    }}
                    aria-label="Settings"
                    aria-haspopup="dialog"
                    aria-expanded={settingsOpen}
                    className={cn(
                      'inline-flex size-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-[#111111d1]',
                      settingsOpen && 'bg-[#111111d1]',
                    )}
                  >
                    <Settings className="size-4" />
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default VideoPlayer
