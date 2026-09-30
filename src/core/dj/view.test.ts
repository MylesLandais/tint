import { describe, expect, it } from 'vitest'
import { analysisDuration, auditionStateForTransition, presetLabel, trackDuration } from './view'

describe('DJ presentation selectors', () => {
  it('formats imported durations and maps transition state without owning engine state', () => {
    expect(analysisDuration(undefined)).toBe('Ready')
    expect(analysisDuration(60.3)).toBe('1:00')
    expect(trackDuration(320)).toBe('5:20')
    expect(presetLabel('filter-echo-exit')).toBe('Filter echo exit')
    const snapshot = { auditionState: 'playing' as const, activeTransitionId: 'first',
      capabilities: { webAudio: true, audioWorklet: false, mediaRecorder: false } }
    expect(auditionStateForTransition(snapshot, 'first')).toBe('playing')
    expect(auditionStateForTransition(snapshot, 'second')).toBe('idle')
  })
})
