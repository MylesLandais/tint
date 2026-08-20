import {
  useEffect,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react'
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '../button'
import { Icon } from '../icon'
import { ProgressBar } from '../progress'
import { cn } from '../../lib/utils'

export type NarrationTransportProps = Omit<HTMLAttributes<HTMLDivElement>, 'onRateChange'> & {
  /** Host-owned audio URL (cached clip). Same seam as chat enableSpeak / MAYA_TTS_SRC. */
  src: string
  label?: string
  /** Playback rates offered in the speed control. */
  rates?: readonly number[]
  onEnded?: () => void
}

const DEFAULT_RATES = [0.75, 1, 1.25, 1.5, 2] as const

/**
 * Play / pause / skip / speed / progress over a host-supplied `src`.
 *
 * Tint never fetches TTS — the host passes a URL the way chat demos pass
 * `MAYA_TTS_SRC`, so the transport works offline against cached fixtures.
 */
export function NarrationTransport({
  src,
  label = 'Narration',
  rates = DEFAULT_RATES,
  onEnded,
  className,
  ...props
}: NarrationTransportProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const labelId = useId()
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [rate, setRate] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.load()
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
  }, [src])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = rate
  }, [rate])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play().then(() => setPlaying(true))
    } else {
      audio.pause()
      setPlaying(false)
    }
  }

  const skip = (delta: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + delta))
    setCurrent(audio.currentTime)
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div
      data-tint-narration-transport=""
      className={cn('flex flex-col gap-2', className)}
      {...props}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false)
          onEnded?.()
        }}
      />
      <div className="flex items-center gap-2">
        <p id={labelId} className="m-0 min-w-0 flex-1 truncate text-xs font-medium text-tint-muted">
          {label}
        </p>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Skip back 10 seconds"
          onClick={() => skip(-10)}
          leading={<Icon icon={SkipBack} size="sm" />}
        />
        <Button
          size="sm"
          variant="secondary"
          aria-labelledby={labelId}
          aria-pressed={playing}
          onClick={toggle}
          leading={<Icon icon={playing ? Pause : Play} size="sm" />}
        >
          {playing ? 'Pause' : 'Play'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label="Skip forward 10 seconds"
          onClick={() => skip(10)}
          leading={<Icon icon={SkipForward} size="sm" />}
        />
        <label className="flex items-center gap-1 text-xs text-tint-muted">
          <span className="sr-only">Playback speed</span>
          <select
            className="rounded-md border border-tint-border bg-tint-surface px-1.5 py-1 text-xs text-tint-ink"
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
          >
            {rates.map((value) => (
              <option key={value} value={value}>
                {value}×
              </option>
            ))}
          </select>
        </label>
      </div>
      <ProgressBar value={progress} label={`${label} progress`} showValue={false} />
    </div>
  )
}
