import type { ModerationEvent } from '../discord-panel/types'

export type ActivityFilters = { channel: string; kind: string; automatedOnly: boolean }
export const EMPTY_ACTIVITY: ActivityFilters = { channel: 'all', kind: 'all', automatedOnly: false }

export function filterActivity(events: readonly ModerationEvent[], filters: ActivityFilters): readonly ModerationEvent[] {
  return events.filter((event) => {
    if (filters.channel !== 'all' && event.channel !== filters.channel) return false
    if (filters.kind !== 'all' && event.kind !== filters.kind) return false
    if (filters.automatedOnly && !event.automated) return false
    return true
  })
}
