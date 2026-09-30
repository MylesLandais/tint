import type { TimelineViewport } from '../../../core/timeline/contracts'
import type { TransitionPreset } from '../../../core/dj/contracts'
import type { TransitionAuditionState } from '../../../core/dj/view'

export type DualWaveformTrack = { label: string; peaks: readonly number[]; color: string }
export type DualWaveformTransition = { startBeat: number; endBeat: number; label: string }
export type DualWaveformProps = {
  viewport: TimelineViewport
  outgoing: DualWaveformTrack
  incoming: DualWaveformTrack
  transition: DualWaveformTransition
  beatsPerBar: number
  /** Host-controlled seek position; defaults to the viewport's first visible beat. */
  positionBeat?: number
  onSeek: (beat: number) => void
  class?: string
}

export type TransitionPresetPickerProps = {
  value: TransitionPreset
  onChange: (preset: TransitionPreset) => void
  disabled?: boolean
  class?: string
}

export type TransitionAuditionControlsProps = {
  state: TransitionAuditionState
  onAudition: () => void
  onStop: () => void
  unavailableReason?: string
  error?: string
  class?: string
}

export type AnalysisQueueStatus = 'queued' | 'decoding' | 'ready' | 'error'

export type AnalysisQueueItem = {
  id: string
  fileName: string
  status: AnalysisQueueStatus
  durationSeconds?: number
  error?: string
}

export type AnalysisQueueProps = {
  items: readonly AnalysisQueueItem[]
  onRetry: (id: string) => void
  class?: string
}

export type ImportTracksDialogProps = {
  open: boolean
  selectedFiles: readonly File[]
  onFilesSelected: (files: File[]) => void
  onImport: () => void
  onClose: () => void
  busy?: boolean
  error?: string
}
