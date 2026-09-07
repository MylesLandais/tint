import type { AutomationPoint } from '../timeline/contracts'

export type TransitionPreset = 'long-bass-swap' | 'filter-echo-exit'

export type DJTrack = {
  id: string
  title: string
  durationSeconds: number
  bpm: number
  key?: string
}

export type DJSetDocument = {
  schemaVersion: '1'
  id: string
  revision: string
  title: string
  description?: string
  bpm: number
  beatsPerBar: number
  /** Track records available to this portable set document. */
  tracks: readonly DJTrack[]
  /** Performance order, referencing `tracks`. */
  trackIds: readonly string[]
  transitions: readonly DJTransition[]
  metadata: Record<string, unknown>
}

export type DJSetCommand =
  | { type: 'tracks.reorder'; trackIds: readonly string[] }
  | { type: 'transitions.generateAuto' }
  | { type: 'transition.preset.update'; transitionId: string; preset: TransitionPreset }
  | {
      type: 'transition.automationPoint.update'
      transitionId: string
      lane: string
      pointIndex: number
      point: AutomationPoint
    }

export type DJTransition = {
  id: string
  fromTrackId: string
  toTrackId: string
  /** Absolute set position in beats. Must begin on a bar boundary. */
  startBeat: number
  lengthBars: number
  beatsPerBar: number
  bpm: number
  preset: TransitionPreset
  automation?: Readonly<Record<string, AutomationLanePlan>>
}

export type AutomationCurve =
  | 'linear'
  | 'step'
  | 'equal-power-in'
  | 'equal-power-out'

export type AutomationLanePlan = {
  curve: AutomationCurve
  points: readonly AutomationPoint[]
}

export type CompiledTransition = {
  transitionId: string
  startBeat: number
  endBeat: number
  durationBeats: number
  durationSeconds: number
  /** Time the outgoing deck remains alive after its dry signal reaches zero. */
  effectTailBeats: number
  lanes: Readonly<Record<string, AutomationLanePlan>>
}
