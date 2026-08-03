/*
 * Demo domain types.
 *
 * These live in the docs, not the library. Tint ships a generic table; the music
 * shape is one thing you can point it at, and keeping the types here is what
 * keeps that honest.
 */

export type MusicCollectionState = 'unreviewed' | 'wishlist' | 'library'

export type MusicIdentityConfidence = 'exact-name' | 'catalog-validated' | 'unresolved'

export type MusicPlatform =
  | 'appleMusic'
  | 'bandcamp'
  | 'beatport'
  | 'discogs'
  | 'soundcloud'
  | 'spotify'
  | 'youtube'

/** The parent grain: a canonical artist with rollups over its catalog. */
export type MusicLibraryArtist = {
  id: string
  name: string
  collectionState: MusicCollectionState
  confidence: MusicIdentityConfidence
  catalog: {
    tracks: number
    releases: number
    labels: number
  }
  platforms: Partial<Record<MusicPlatform, string>>
}

/** The child grain, revealed by expanding an artist row. */
export type MusicTrack = {
  id: string
  artistId: string
  title: string
  bpm: number
  /** Camelot notation, e.g. `4A`. */
  key: string
  /** 1–5, rendered by the `rating` field type. */
  energy: number
  /** Seconds. */
  duration: number
  /** ISO date. */
  added: string
}

export const PLATFORM_LABELS: Record<MusicPlatform, string> = {
  appleMusic: 'Apple Music',
  bandcamp: 'Bandcamp',
  beatport: 'Beatport',
  discogs: 'Discogs',
  soundcloud: 'SoundCloud',
  spotify: 'Spotify',
  youtube: 'YouTube',
}

export const COLLECTION_STATE_LABELS: Record<MusicCollectionState, string> = {
  unreviewed: 'Unreviewed',
  wishlist: 'Wishlist',
  library: 'Library',
}

export const CONFIDENCE_LABELS: Record<MusicIdentityConfidence, string> = {
  'exact-name': 'Exact identity match',
  'catalog-validated': 'Catalog validated',
  unresolved: 'Needs resolution',
}

/** Seconds to `m:ss`. */
export function formatDuration(seconds: number): string {
  const total = Math.round(seconds)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
