import { useEffect, type RefObject } from 'react'
import { useLatestRef } from './useLatestRef'

export type DismissableHandlers = {
  /** Fired on a pointer press outside the referenced element. */
  onPointerDownOutside?: (event: MouseEvent) => void
  /** Fired when Escape is pressed while open. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void
}

/**
 * Wires document-level dismissal (outside pointer press + Escape) for
 * popover-style surfaces. Handlers always run against the latest render's
 * closures, so callers can pass inline functions without re-subscribing.
 */
export function useDismissable(
  isOpen: boolean,
  ref: RefObject<HTMLElement | null>,
  handlers: DismissableHandlers,
) {
  const handlersRef = useLatestRef(handlers)

  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        handlersRef.current.onPointerDownOutside?.(event)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handlersRef.current.onEscapeKeyDown?.(event)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, ref, handlersRef])
}
