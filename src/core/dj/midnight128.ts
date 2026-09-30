import { generateAutoTransitions } from './commands'
import type { DJSetDocument, DJTrack } from './contracts'

export type ImportedMidnight128Track = {
  trackId: string
  durationSeconds: number
}

const REFERENCE_TRACKS = [
  { id: 'here-we-go', title: 'Michele Mancini — Here We Go', durationSeconds: 320 },
  { id: 'apapacho', title: 'Apapacho', durationSeconds: 391 },
  { id: 'trajadao', title: 'XAAV — Trajadão', durationSeconds: 345 },
] as const

const DURATION_TOLERANCE_SECONDS = 3

export function identifyMidnight128Track(file: Pick<File, 'name'>): string {
  const normalized = file.name.toLowerCase().replace(/\.[^.]+$/, '').replace(/^\d+[-_ ]*/, '')
  const match = REFERENCE_TRACKS.find((track) => track.id === normalized)
  if (!match) throw new Error(`Unknown Midnight 128 reference filename: ${file.name}`)
  return match.id
}

export function createMidnight128Set(
  importedTracks: readonly ImportedMidnight128Track[],
): DJSetDocument {
  if (importedTracks.length !== REFERENCE_TRACKS.length) {
    throw new Error('Midnight 128 requires exactly three reference tracks')
  }
  const byId = new Map<string, ImportedMidnight128Track>()
  for (const track of importedTracks) {
    if (byId.has(track.trackId)) throw new Error(`Duplicate Midnight 128 track: ${track.trackId}`)
    byId.set(track.trackId, track)
  }

  const tracks: DJTrack[] = REFERENCE_TRACKS.map((reference) => {
    const imported = byId.get(reference.id)
    if (!imported) throw new Error(`Missing Midnight 128 track: ${reference.id}`)
    if (!Number.isFinite(imported.durationSeconds)
      || Math.abs(imported.durationSeconds - reference.durationSeconds) > DURATION_TOLERANCE_SECONDS) {
      throw new RangeError(`Unexpected duration for ${reference.id}: ${imported.durationSeconds}`)
    }
    return {
      id: reference.id,
      title: reference.title,
      durationSeconds: imported.durationSeconds,
      bpm: 128,
      key: '3A',
    }
  })

  const base: DJSetDocument = {
    schemaVersion: '1',
    id: 'demo-midnight-128',
    revision: 'r1',
    title: 'Midnight 128',
    description: 'Deep Tech → Latin Tech → Peak Tech House',
    bpm: 128,
    beatsPerBar: 4,
    tracks,
    trackIds: REFERENCE_TRACKS.map((track) => track.id),
    transitions: [],
    metadata: { key: '3A', durationSeconds: 966 },
  }
  return { ...base, transitions: generateAutoTransitions(base) }
}
