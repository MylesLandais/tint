import type { ActivitySignal, ActivitySort } from './contracts'

export const ACTIVITY_SORTS: readonly ActivitySort[] = ['hot', 'new', 'top']

const SIGNAL_TONE: Record<ActivitySignal, 'danger' | 'info' | 'accent' | 'warning' | 'success'> = {
  hot: 'danger', new: 'info', top: 'accent', rising: 'warning', artifact: 'success', notify: 'info', intent: 'accent',
}

export function activitySignalTone(signal: ActivitySignal): 'danger' | 'info' | 'accent' | 'warning' | 'success' {
  return SIGNAL_TONE[signal]
}
