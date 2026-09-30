export type ToastTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

export type ToastInput = {
  title: string
  description?: string
  tone?: ToastTone
  durationMs?: number
}

export type ToastRecord = {
  id: string
  title: string
  description?: string
  tone: ToastTone
  durationMs: number
}

export const DEFAULT_TOAST_DURATION_MS = 4000

export function createToastRecord(id: string, input: ToastInput): ToastRecord {
  return {
    id,
    title: input.title,
    description: input.description,
    tone: input.tone ?? 'neutral',
    durationMs: input.durationMs ?? DEFAULT_TOAST_DURATION_MS,
  }
}

/** Newest toasts lead; older toasts remain available when the visible limit changes. */
export function addToast(records: readonly ToastRecord[], record: ToastRecord): ToastRecord[] {
  return [record, ...records]
}

export function removeToast(records: readonly ToastRecord[], id: string): ToastRecord[] {
  return records.filter((record) => record.id !== id)
}

export function visibleToasts(records: readonly ToastRecord[], limit: number): ToastRecord[] {
  return records.slice(0, Math.max(0, Math.floor(limit)))
}
