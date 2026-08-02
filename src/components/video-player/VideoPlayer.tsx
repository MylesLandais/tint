import { useEffect, useMemo, useRef, useState, type VideoHTMLAttributes } from 'react'
import { Settings } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { SettingsPopout, type SettingsPopoutItem } from '@/components/settings-popout'
import { Slider } from './Slider'
import { VolumeControl } from './VolumeControl'
import { useVideoPlayer } from './useVideoPlayer'

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
  const {
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
  } = useVideoPlayer(videoRef, { onPlay, onPause })
  const [showControls, setShowControls] = useState(!autoHideControls)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [volumeOpen, setVolumeOpen] = useState(false)

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
        'relative mx-auto w-full max-w-4xl rounded-lg bg-[#11111198] shadow-[0_0_20px_rgba(0,0,0,0.2)] backdrop-blur-sm',
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
        className="w-full cursor-pointer rounded-lg bg-black"
        src={src}
        poster={poster}
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause video' : 'Play video'}
        {...mediaHandlers}
        {...videoProps}
      />

      <AnimatePresence>
        {showControls && (
          <motion.div
            className="absolute bottom-3 left-1/2 z-20 w-2/3 max-w-xl -translate-x-1/2 rounded-xl bg-[#11111198] px-3 py-2.5 backdrop-blur-md"
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
                onChange={seek}
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
                  onVolumeChange={changeVolume}
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
                      'inline-flex size-8 items-center justify-center rounded-md text-white transition-colors hover:bg-[#111111d1]',
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
