import type { AutomationPoint, TimelineViewport } from '../../../core/timeline/contracts'

export type WaveformCanvasProps = {
  viewport: TimelineViewport
  peaks: readonly number[]
  color: string
  onSeek: (beat: number) => void
  class?: string
}
export type BeatGridOverlayProps = { viewport: TimelineViewport; beatsPerBar: number; class?: string }
export type TransitionRegionProps = {
  viewport: TimelineViewport
  startBeat: number
  endBeat: number
  label: string
  class?: string
}
export type AutomationLaneProps = {
  viewport: TimelineViewport
  label: string
  points: readonly AutomationPoint[]
  min?: number
  max?: number
  step?: number
  onPointChange: (index: number, point: AutomationPoint) => void
  class?: string
}
