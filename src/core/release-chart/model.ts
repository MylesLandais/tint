import type { ScatterPoint } from '../scatter-plot/model'

export type ReleaseScore = { id: string; size: number; score: number }

/** Release size uses GiB; scores are supplied by the host and never inferred. */
export function releaseScatterRows(rows: readonly ReleaseScore[]): ScatterPoint[] {
  return rows
    .filter((row) => row.size >= 0 && Number.isFinite(row.size) && Number.isFinite(row.score))
    .map((row) => ({ id: row.id, x: row.size, y: row.score }))
}
