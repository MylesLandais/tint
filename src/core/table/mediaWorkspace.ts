export type MediaRelease = {
  id: string
  title: string
  indexer: string
  size: string
  peers: string
  age: string
  score: number
}

/** Search intentionally covers title and indexer, matching the existing preview. */
export function filterMediaReleases(releases: readonly MediaRelease[], query: string): readonly MediaRelease[] {
  const needle = query.toLowerCase()
  return releases.filter((release) => `${release.title} ${release.indexer}`.toLowerCase().includes(needle))
}
