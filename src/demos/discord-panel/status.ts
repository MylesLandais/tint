/** Collapse the client's idle state to the connecting tone used by the panel. */
export function connectionTone(state: string): 'online' | 'connecting' | 'reconnecting' | 'offline' | 'error' {
  if (state === 'online' || state === 'reconnecting' || state === 'offline' || state === 'error') return state
  return 'connecting'
}
