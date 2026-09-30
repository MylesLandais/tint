import type { AudioEngineSnapshot } from '../audio-engine/store'
import type { TransitionPreset } from './contracts'

export type TransitionAuditionState = AudioEngineSnapshot['auditionState']

export function analysisDuration(duration: number | undefined): string {
  if (duration === undefined || !Number.isFinite(duration) || duration < 0) return 'Ready'
  const rounded = Math.round(duration)
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`
}

export function trackDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${Math.round(seconds - minutes * 60).toString().padStart(2, '0')}`
}

export function presetLabel(preset: TransitionPreset): string {
  return preset === 'long-bass-swap' ? 'Long bass swap' : 'Filter echo exit'
}

export function auditionStateForTransition(snapshot: AudioEngineSnapshot, transitionId: string): TransitionAuditionState {
  if (snapshot.auditionState === 'unavailable') return 'unavailable'
  return snapshot.activeTransitionId === transitionId ? snapshot.auditionState : 'idle'
}
