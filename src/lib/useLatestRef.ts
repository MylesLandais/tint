import { useEffect, useRef } from 'react'

/**
 * Keeps a ref pointed at the latest value. Lets long-lived subscriptions
 * (document listeners, timers) read the most recent props/callbacks without
 * being torn down and re-created on every render.
 */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
