export type EventReviewOption = { id: string; label: string }
export type EventReviewHistoryDate = { dateTime: string; label: string }

/** Media position is independent of the calendar/history date. */
export function eventReviewTimestamp(seconds: number | null | undefined): string | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return null
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

/** Unknown saved IDs stay visible until the host explicitly removes them. */
export function eventReviewPeople(
  candidates: readonly EventReviewOption[], selectedIds: readonly string[],
): EventReviewOption[] {
  const people = [...new Map(candidates.map((person) => [person.id, person])).values()]
  const knownIds = new Set(people.map((person) => person.id))
  for (const id of new Set(selectedIds)) {
    if (!knownIds.has(id)) people.push({ id, label: `Unknown person (${id})` })
  }
  return people
}

export function toggleEventReviewPerson(selectedIds: readonly string[], id: string, selected: boolean): string[] {
  return selected
    ? [...new Set([...selectedIds, id])]
    : selectedIds.filter((entry) => entry !== id)
}
