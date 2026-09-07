import { BeatGridOverlay } from '../timeline/BeatGridOverlay'
import type { TimelineViewport } from '../timeline/contracts'
import { TransitionRegion } from '../timeline/TransitionRegion'
import { WaveformCanvas } from '../timeline/WaveformCanvas'

export type DualWaveformTrack = {
  label: string
  peaks: readonly number[]
  color: string
}

export type DualWaveformTransition = {
  startBeat: number
  endBeat: number
  label: string
}

export type DualWaveformProps = {
  viewport: TimelineViewport
  outgoing: DualWaveformTrack
  incoming: DualWaveformTrack
  transition: DualWaveformTransition
  beatsPerBar: number
  onSeek: (beat: number) => void
  className?: string
}

export function DualWaveform({
  viewport,
  outgoing,
  incoming,
  transition,
  beatsPerBar,
  onSeek,
  className,
}: DualWaveformProps) {
  return (
    <section
      aria-label={`${outgoing.label} to ${incoming.label} waveforms`}
      data-tint-dual-waveform=""
      className={className ?? 'relative overflow-hidden rounded-lg border border-tint-border bg-tint-surface'}
    >
      <div className="relative h-24 border-b border-tint-border">
        <span className="absolute left-2 top-2 z-20 rounded bg-tint-surface/85 px-2 py-1 text-xs font-medium">
          {outgoing.label}
        </span>
        <WaveformCanvas
          viewport={viewport}
          peaks={outgoing.peaks}
          color={outgoing.color}
          onSeek={onSeek}
        />
      </div>
      <div className="relative h-24">
        <span className="absolute left-2 top-2 z-20 rounded bg-tint-surface/85 px-2 py-1 text-xs font-medium">
          {incoming.label}
        </span>
        <WaveformCanvas
          viewport={viewport}
          peaks={incoming.peaks}
          color={incoming.color}
          onSeek={onSeek}
        />
      </div>
      <BeatGridOverlay
        viewport={viewport}
        beatsPerBar={beatsPerBar}
        className="pointer-events-none absolute inset-0 z-10"
      />
      <TransitionRegion
        viewport={viewport}
        startBeat={transition.startBeat}
        endBeat={transition.endBeat}
        label={transition.label}
        className="pointer-events-none absolute inset-y-0 z-10 border-x border-tint-accent/70 bg-tint-accent/10"
      />
    </section>
  )
}
