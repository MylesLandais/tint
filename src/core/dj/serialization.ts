import type { DJSetDocument, DJTrack, DJTransition, TransitionPreset } from './contracts'
import { compileTransition } from './transitionCompiler'

export function serializeDJSet(document: DJSetDocument): string {
  validateDJSet(document)
  return JSON.stringify(document, null, 2)
}

export function parseDJSet(serialized: string): DJSetDocument {
  let value: unknown
  try {
    value = JSON.parse(serialized)
  } catch {
    throw new TypeError('DJ set must be valid JSON')
  }
  validateDJSet(value)
  return value
}

function validateDJSet(value: unknown): asserts value is DJSetDocument {
  if (!isRecord(value)) throw new TypeError('DJ set must be an object')
  if (value.schemaVersion !== '1') throw new TypeError('Unsupported DJ set schema version')
  requireString(value.id, 'Set id')
  requireString(value.revision, 'Set revision')
  requireString(value.title, 'Set title')
  requirePositiveFinite(value.bpm, 'Set BPM')
  requirePositiveFinite(value.beatsPerBar, 'Set beats per bar')
  if (!Array.isArray(value.tracks)) throw new TypeError('Set tracks must be an array')
  if (!Array.isArray(value.trackIds)) throw new TypeError('Set trackIds must be an array')
  if (!Array.isArray(value.transitions)) throw new TypeError('Set transitions must be an array')
  if (!isRecord(value.metadata)) throw new TypeError('Set metadata must be an object')

  value.tracks.forEach(validateTrack)
  const trackIds = new Set(value.tracks.map((track) => (track as DJTrack).id))
  if (trackIds.size !== value.tracks.length) throw new TypeError('Track ids must be unique')

  for (const trackId of value.trackIds) {
    requireString(trackId, 'Ordered track id')
    if (!trackIds.has(trackId)) throw new TypeError(`Set references unknown track: ${trackId}`)
  }
  if (new Set(value.trackIds).size !== value.trackIds.length) {
    throw new TypeError('Set track order must not contain duplicate ids')
  }

  value.transitions.forEach((transition) => {
    validateTransition(transition)
    const typed = transition as DJTransition
    if (!trackIds.has(typed.fromTrackId) || !trackIds.has(typed.toTrackId)) {
      throw new TypeError(`Transition references unknown track: ${typed.id}`)
    }
    compileTransition(typed)
  })
}

function validateTrack(value: unknown): asserts value is DJTrack {
  if (!isRecord(value)) throw new TypeError('Track must be an object')
  requireString(value.id, 'Track id')
  requireString(value.title, 'Track title')
  requirePositiveFinite(value.durationSeconds, 'Track duration')
  requirePositiveFinite(value.bpm, 'Track BPM')
  if (value.key !== undefined) requireString(value.key, 'Track key')
}

function validateTransition(value: unknown): asserts value is DJTransition {
  if (!isRecord(value)) throw new TypeError('Transition must be an object')
  requireString(value.id, 'Transition id')
  requireString(value.fromTrackId, 'Outgoing track id')
  requireString(value.toTrackId, 'Incoming track id')
  requireNonNegativeFinite(value.startBeat, 'Transition start beat')
  requirePositiveFinite(value.lengthBars, 'Transition bar length')
  requirePositiveFinite(value.beatsPerBar, 'Transition beats per bar')
  requirePositiveFinite(value.bpm, 'Transition BPM')
  if (!isTransitionPreset(value.preset)) throw new TypeError('Unknown transition preset')
}

function isTransitionPreset(value: unknown): value is TransitionPreset {
  return value === 'long-bass-swap' || value === 'filter-echo-exit'
}

function requireString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) throw new TypeError(`${label} must be a string`)
}

function requirePositiveFinite(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a positive finite number`)
  }
}

function requireNonNegativeFinite(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative finite number`)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
