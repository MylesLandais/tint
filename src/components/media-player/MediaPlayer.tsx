import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type VideoHTMLAttributes,
} from 'react'
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { motion } from 'motion/react'
import { cn } from '../../lib/utils'
import { Icon, Spinner } from '../icon'
import { formatTime, MediaPlaceholder, VolumeControl } from '../media'
import { MediaScrubber } from './MediaScrubber'
import { useMediaPlayback } from './useMediaPlayback'
import type { MediaSize } from './sizes'
import { VideoPlayer } from '../video-player'

const FALLBACK_ACCENT_COLOR = '#0f6e56' // src/styles/themes/tint.css's light-mode --tint-accent

type MediaPlayerBaseProps = {
  /** Media source URL. An object URL from a recording works as well as a remote file. */
  src: string
  /** Accessible name for the media element and every generated control label. */
  label: string
  /** Visible title. Falls back to `label`. */
  title?: string
  /** Known duration, shown before metadata loads so nothing jumps. */
  duration?: number
  /** Decorative amplitude samples, drawn behind the scrubber at every tier. */
  waveform?: readonly number[]
  /** Enables the reference design's offset shadow. Disabled by default. */
  shadow?: boolean
  /** Explicit tier override. Auto-detected from container width when omitted. */
  size?: MediaSize
  className?: string
  onPlay?: () => void
  onPause?: () => void
  /** Adds a previous-track control. Omit the callback to omit the control. */
  onPrevious?: () => void
  /** Adds a next-track control. Omit the callback to omit the control. */
  onNext?: () => void
}

export type MediaPlayerAudioProps = MediaPlayerBaseProps & {
  kind: 'audio'
  /** Optional artist, speaker, or source shown above the title. */
  artist?: string
  /** Optional square artwork URL. The white-label placeholder renders when omitted or on load failure. */
  artwork?: string
  /** Artwork alternative text. Keep empty when the image only repeats the track metadata. */
  artworkAlt?: string
}

export type MediaPlayerVideoProps = MediaPlayerBaseProps & {
  kind: 'video'
  /** Optional poster image shown before playback begins. */
  poster?: string
  /** Selectable rates in the settings popout. */
  playbackSpeeds?: readonly number[]
  /** Hide the overlay until hover/focus; defaults to the original VideoPlayer behavior. */
  autoHideControls?: boolean
} & Omit<
    VideoHTMLAttributes<HTMLVideoElement>,
    'src' | 'poster' | 'className' | 'controls' | 'onPlay' | 'onPause'
  >

export type MediaPlayerProps = MediaPlayerAudioProps | MediaPlayerVideoProps

function MediaPlayerVideo(props: MediaPlayerVideoProps) {
  const {
    kind: _kind,
    src,
    label,
    title,
    duration,
    shadow,
    size,
    className,
    onPlay,
    onPause,
    poster,
    playbackSpeeds,
    autoHideControls,
    waveform: _waveform,
    onPrevious: _onPrevious,
    onNext: _onNext,
    ...videoProps
  } = props

  return (
    <VideoPlayer
      {...videoProps}
      src={src}
      label={label}
      title={title}
      poster={poster}
      duration={duration}
      playbackSpeeds={playbackSpeeds}
      autoHideControls={autoHideControls}
      size={size}
      shadow={shadow}
      className={className}
      onPlay={onPlay}
      onPause={onPause}
    />
  )
}

function MediaPlayerAudio(props: MediaPlayerAudioProps) {
  const {
    src,
    label,
    title = label,
    duration: durationHint,
    waveform,
    shadow = false,
    size,
    className,
    onPlay,
    onPause,
    onPrevious,
    onNext,
  } = props

  const rootRef = useRef<HTMLDivElement>(null)
  const mediaElementRef = useRef<HTMLMediaElement | null>(null)
  const setMediaRef = useCallback((element: HTMLAudioElement | HTMLVideoElement | null) => {
    mediaElementRef.current = element
  }, [])

  const { state, actions, mediaEventHandlers } = useMediaPlayback(mediaElementRef, {
    src,
    durationHint,
    onPlay,
    onPause,
  })
  const { playing, currentTime, duration, volume, muted, buffering, failed } = state

  const artwork = props.artwork
  const [artworkFailed, setArtworkFailed] = useState(false)
  useEffect(() => setArtworkFailed(false), [src, artwork])

  const [accentColor, setAccentColor] = useState(FALLBACK_ACCENT_COLOR)
  useEffect(() => {
    const resolve = () => {
      const root = rootRef.current
      if (!root) return
      const value = getComputedStyle(root).getPropertyValue('--tint-accent').trim()
      if (value) setAccentColor(value)
    }
    resolve()
    const observer = new MutationObserver(resolve)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-scheme'],
    })
    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null
    media?.addEventListener('change', resolve)
    return () => {
      observer.disconnect()
      media?.removeEventListener('change', resolve)
    }
  }, [])
  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0
  const remaining = duration > 0 ? Math.max(duration - currentTime, 0) : 0
  return (
    <div
      ref={rootRef}
      data-tint-media-player=""
      data-kind="audio"
      data-size={size}
      data-shadow={shadow ? 'offset' : undefined}
      className={cn('w-full max-w-4xl', className)}
    >
      <audio
        ref={setMediaRef}
        src={src}
        preload="metadata"
        aria-label={label}
        {...mediaEventHandlers}
      />

      <div
        data-media-surface-wrap=""
        className="relative flex min-w-0 flex-col gap-3 rounded-lg border border-tint-border-strong bg-tint-panel p-3 text-tint-ink backdrop-blur-xl"
      >
        <div
          data-media-surface=""
          className="relative w-full shrink-0 overflow-hidden rounded-md bg-tint-surface"
        >
          {artwork && !artworkFailed ? (
            <img
              src={artwork}
              alt={props.artworkAlt ?? ''}
              className="size-full object-cover"
              onError={() => setArtworkFailed(true)}
            />
          ) : (
            <MediaPlaceholder />
          )}
        </div>

        <div data-media-bar="" className="flex min-w-0 items-center gap-5">
          {failed ? (
            <p role="alert" className="m-0 truncate text-xs text-tint-danger-ink">
              This audio could not be played.
            </p>
          ) : (
            <>
              <div data-media-transport="" className="flex shrink-0 items-center gap-2.5">
                {onPrevious ? (
                  <motion.button
                    type="button"
                    data-media-previous=""
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
                  onClick={actions.toggle}
                  disabled={failed}
                  aria-label={playing ? `Pause ${title}` : `Play ${title}`}
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
                    data-media-next=""
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
                data-media-divider=""
                aria-hidden="true"
                className="h-12 w-px shrink-0 bg-tint-border-strong"
              />

              <div data-media-content="" className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                <div data-media-meta="" className="flex min-w-0 items-baseline gap-2">
                  {props.artist ? (
                    <span
                      data-media-artist=""
                      className="max-w-[45%] shrink-0 truncate text-[10px] font-medium tracking-[0.14em] text-tint-muted uppercase"
                    >
                      {props.artist}
                    </span>
                  ) : null}
                  <span className="min-w-0 truncate text-base leading-none font-medium tracking-tight text-tint-ink">
                    {title}
                  </span>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <span
                    data-media-time="elapsed"
                    className="w-8 shrink-0 font-mono text-[11px] tracking-wide tabular-nums text-tint-muted"
                  >
                    {formatTime(currentTime)}
                  </span>

                  <MediaScrubber
                    progress={progress}
                    onSeek={actions.seek}
                    waveform={waveform}
                    color={accentColor}
                    label={label}
                    tone="surface"
                  />

                  <span
                    data-media-time="remaining"
                    className="w-10 shrink-0 text-right font-mono text-[11px] tracking-wide tabular-nums text-tint-muted"
                  >
                    {duration > 0 ? `-${formatTime(remaining)}` : '0:00'}
                  </span>
                </div>
              </div>

              <span
                data-media-divider=""
                aria-hidden="true"
                className="h-12 w-px shrink-0 bg-tint-border-strong"
              />

              <div data-media-volume="" className="shrink-0">
                <VolumeControl
                  volume={muted ? 0 : volume}
                  isMuted={muted}
                  onVolumeChange={actions.changeVolume}
                  onToggleMute={actions.toggleMute}
                  tone="surface"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Unified media entry point with intentionally distinct presentations:
 * audio uses the compact responsive rail, while video uses the immersive
 * VideoPlayer chrome. Both retain the shared media primitives and callback API.
 *
 * The two presentations are separate components rather than two branches of one
 * body on purpose. This used to return the video branch early and then call the
 * audio branch's eight hooks below it — a rules-of-hooks violation that happened
 * not to fault, because React only reports "fewer hooks than expected" when at
 * least one hook runs on the shorter path, and the video path ran none. Adding a
 * single hook to the video branch, or anywhere above the discriminator, would
 * have turned a `kind` change into a hard render error. Each branch now owns its
 * own hook order, so that trap is gone rather than merely dormant.
 *
 * Neither branch renders a `<track>`: tint has no captions API yet, so a video
 * carrying subtitles has to be composed by the host for now.
 */
export function MediaPlayer(props: MediaPlayerProps) {
  return props.kind === 'video' ? (
    <MediaPlayerVideo {...props} />
  ) : (
    <MediaPlayerAudio {...props} />
  )
}
