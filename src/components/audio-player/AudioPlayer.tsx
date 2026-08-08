import { Music2, Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { Icon, Spinner } from '../icon'
import { formatTime, Slider, VolumeControl } from '../media'

export type AudioPlayerProps = {
  /** Audio source URL. An object URL from a recording works as well as a remote file. */
  src: string
  /** Accessible name and fallback track title. */
  label: string
  /** Track title. Falls back to `label`. */
  title?: string
  /** Optional artist, speaker, or source shown above the title. */
  artist?: string
  /** Optional square artwork URL. A themed placeholder is rendered when omitted. */
  artwork?: string
  /** Artwork alternative text. Keep empty when the image only repeats the track metadata. */
  artworkAlt?: string
  /** Known duration, shown before metadata loads so the row does not jump. */
  duration?: number
  /** Decorative amplitude samples, drawn behind the scrubber. */
  waveform?: readonly number[]
  /** Enables the reference design's offset shadow. Disabled by default. */
  shadow?: boolean
  className?: string
  onPlay?: () => void
  onPause?: () => void
  /** Adds a previous-track control. Omit the callback to omit the control. */
  onPrevious?: () => void
  /** Adds a next-track control. Omit the callback to omit the control. */
  onNext?: () => void
}

/**
 * A compact, container-responsive audio player.
 *
 * Playback state lives here rather than in props, matching `VideoPlayer`: it is
 * media-element state the host has no reason to drive. The component responds
 * to the width of its own slot, so the same instance can live in a full-width
 * media rail or a narrow chat bubble without viewport-specific JavaScript.
 */
export function AudioPlayer({
  src,
  label,
  title = label,
  artist,
  artwork,
  artworkAlt = '',
  duration: durationHint,
  waveform,
  shadow = false,
  className,
  onPlay,
  onPause,
  onPrevious,
  onNext,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
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
    const audio = audioRef.current
    if (!audio || !Number.isFinite(duration) || duration <= 0) return
    const next = (percentage / 100) * duration
    audio.currentTime = next
    setCurrentTime(next)
  }

  const toggle = () => {
    const audio = audioRef.current
    if (!audio || failed) return
    if (!audio.paused) {
      audio.pause()
      return
    }
    // `play()` rejects on autoplay policy or a bad source; either way the UI
    // must not be left claiming it is playing.
    void Promise.resolve(audio.play()).catch(() => {
      setBuffering(false)
      setFailed(true)
    })
  }

  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0
  const remaining = duration > 0 ? Math.max(duration - currentTime, 0) : 0

  const changeVolume = (next: number) => {
    const level = next / 100
    setVolume(level)
    setMuted(level === 0)
    if (audioRef.current) {
      audioRef.current.volume = level
      audioRef.current.muted = level === 0
    }
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    if (audioRef.current) audioRef.current.muted = next
  }

  return (
    <div
      data-tint-audio-player=""
      data-shadow={shadow ? 'offset' : undefined}
      className={cn('w-full max-w-[42.5rem]', className)}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        aria-label={label}
        onLoadedMetadata={(event) => {
          const next = event.currentTarget.duration
          if (Number.isFinite(next)) setDuration(next)
        }}
        onDurationChange={(event) => {
          const next = event.currentTarget.duration
          if (Number.isFinite(next)) setDuration(next)
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => {
          setPlaying(true)
          setBuffering(false)
          onPlay?.()
        }}
        onPause={() => {
          setPlaying(false)
          setBuffering(false)
          onPause?.()
        }}
        onEnded={() => {
          setPlaying(false)
          setCurrentTime(0)
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onError={() => {
          setBuffering(false)
          setFailed(true)
          setPlaying(false)
        }}
      />

      <div
        data-audio-surface=""
        className="relative flex min-h-[5.25rem] min-w-0 items-center gap-5 rounded-lg border border-tint-border-strong px-4 py-3 text-tint-ink backdrop-blur-xl"
      >
        <div
          data-audio-artwork=""
          className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-sm border border-tint-border-strong bg-tint-surface"
        >
          {artwork ? (
            <img src={artwork} alt={artworkAlt} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center bg-[linear-gradient(145deg,var(--tint-accent-soft),var(--tint-surface))] text-tint-accent">
              <Icon icon={Music2} size="xl" />
            </div>
          )}
        </div>

        <div data-audio-transport="" className="flex shrink-0 items-center gap-2.5">
          {onPrevious ? (
            <motion.button
              type="button"
              data-audio-previous=""
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={onPrevious}
              aria-label={`Previous track before ${title}`}
              className="inline-flex size-8 items-center justify-center rounded-sm text-tint-ink transition-colors hover:bg-tint-accent-soft hover:text-tint-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
            >
              <Icon icon={SkipBack} size="lg" />
            </motion.button>
          ) : null}

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggle}
            disabled={failed}
            aria-label={playing ? `Pause ${label}` : `Play ${label}`}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-tint-border-strong bg-tint-panel text-tint-ink transition-colors hover:border-tint-ink hover:bg-tint-ink hover:text-tint-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {buffering ? (
              <Spinner size="sm" />
            ) : (
              <Icon
                icon={playing ? Pause : Play}
                size="sm"
                className={playing ? undefined : 'translate-x-px'}
              />
            )}
          </motion.button>

          {onNext ? (
            <motion.button
              type="button"
              data-audio-next=""
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={onNext}
              aria-label={`Next track after ${title}`}
              className="inline-flex size-8 items-center justify-center rounded-sm text-tint-ink transition-colors hover:bg-tint-accent-soft hover:text-tint-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
            >
              <Icon icon={SkipForward} size="lg" />
            </motion.button>
          ) : null}
        </div>

        <span
          data-audio-divider=""
          aria-hidden="true"
          className="h-12 w-px shrink-0 bg-tint-border-strong"
        />

        <div data-audio-content="" className="flex min-w-0 flex-1 flex-col justify-center gap-2">
          {failed ? (
            <p role="alert" className="m-0 truncate text-xs text-tint-danger-ink">
              This audio could not be played.
            </p>
          ) : (
            <>
              <div data-audio-meta="" className="flex min-w-0 items-baseline gap-2">
                {artist ? (
                  <span
                    data-audio-artist=""
                    className="max-w-[45%] shrink-0 truncate text-[10px] font-medium tracking-[0.14em] text-tint-muted uppercase"
                  >
                    {artist}
                  </span>
                ) : null}
                <span className="min-w-0 truncate font-serif text-base leading-none italic tracking-tight text-tint-ink">
                  {title}
                </span>
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <span
                  data-audio-time="elapsed"
                  className="w-8 shrink-0 font-mono text-[11px] tracking-wide tabular-nums text-tint-muted"
                >
                  {formatTime(currentTime)}
                </span>

                <div className="relative min-w-12 flex-1 py-2">
                  {waveform?.length ? <Waveform samples={waveform} progress={progress} /> : null}
                  <Slider
                    value={progress}
                    onChange={seek}
                    aria-label={`Seek ${label}`}
                    showThumb
                    fillClassName="bg-tint-accent"
                    thumbClassName="bg-tint-ink"
                    className="h-px text-tint-ink"
                  />
                </div>

                <span
                  data-audio-time="remaining"
                  className="w-10 shrink-0 text-right font-mono text-[11px] tracking-wide tabular-nums text-tint-muted"
                >
                  {duration > 0 ? `-${formatTime(remaining)}` : '0:00'}
                </span>
              </div>
            </>
          )}
        </div>

        <span
          data-audio-divider=""
          aria-hidden="true"
          className="h-12 w-px shrink-0 bg-tint-border-strong"
        />

        <div data-audio-volume="" className="shrink-0">
          <VolumeControl
            volume={muted ? 0 : volume}
            isMuted={muted}
            onVolumeChange={changeVolume}
            onToggleMute={toggleMute}
            tone="surface"
          />
        </div>
      </div>
    </div>
  )
}

/** Decorative amplitude bars behind the real slider control. */
function Waveform({ samples, progress }: { samples: readonly number[]; progress: number }) {
  const peak = Math.max(...samples, 1)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-1/2 flex h-4 -translate-y-1/2 items-center gap-px opacity-45"
    >
      {samples.map((amplitude, index) => {
        const played = (index / samples.length) * 100 <= progress
        return (
          <span
            key={index}
            className={cn(
              'min-h-px flex-1 rounded-full',
              played ? 'bg-tint-accent' : 'bg-tint-border-strong',
            )}
            style={{ height: `${Math.max(0, Math.min(amplitude / peak, 1)) * 100}%` }}
          />
        )
      })}
    </div>
  )
}
