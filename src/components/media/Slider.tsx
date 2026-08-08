import { useRef, type PointerEvent } from 'react'
import { motion } from 'motion/react'
import { cn } from '../../lib/utils'

export type SliderProps = {
  value: number
  onChange: (value: number) => void
  className?: string
  fillClassName?: string
  thumbClassName?: string
  showThumb?: boolean
  orientation?: 'horizontal' | 'vertical'
  'aria-label': string
}

export function Slider({
  value,
  onChange,
  className,
  fillClassName,
  thumbClassName,
  showThumb = false,
  orientation = 'horizontal',
  'aria-label': ariaLabel,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isVertical = orientation === 'vertical'
  const safeValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), 100) : 0

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return

    if (isVertical) {
      if (rect.height === 0) return
      const percentage = ((rect.bottom - clientY) / rect.height) * 100
      onChange(Math.min(Math.max(percentage, 0), 100))
      return
    }

    if (rect.width === 0) return
    const percentage = ((clientX - rect.left) / rect.width) * 100
    onChange(Math.min(Math.max(percentage, 0), 100))
  }

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event.clientX, event.clientY)
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    updateFromPointer(event.clientX, event.clientY)
  }

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-orientation={orientation}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
      className={cn(
        // Colour is inherited, not hardcoded: this began as video chrome, where
        // `--tint-chrome-ink` is deliberately fixed white and never flips with the
        // scheme. On an in-page surface that would be invisible in light mode, so
        // each consumer sets the text colour and the track follows it.
        'relative cursor-pointer rounded-full bg-current/20 outline-none focus-visible:ring-2 focus-visible:ring-current/60',
        isVertical ? 'h-full w-1' : 'h-1 w-full',
        className,
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
      onKeyDown={(event) => {
        const increase =
          event.key === 'ArrowRight' ||
          event.key === 'ArrowUp' ||
          event.key === 'PageUp'
        const decrease =
          event.key === 'ArrowLeft' ||
          event.key === 'ArrowDown' ||
          event.key === 'PageDown'

        if (increase) {
          event.preventDefault()
          onChange(Math.min(safeValue + 5, 100))
        }
        if (decrease) {
          event.preventDefault()
          onChange(Math.max(safeValue - 5, 0))
        }
        if (event.key === 'Home') {
          event.preventDefault()
          onChange(0)
        }
        if (event.key === 'End') {
          event.preventDefault()
          onChange(100)
        }
      }}
    >
      <motion.div
        className={cn(
          'absolute rounded-full bg-current',
          isVertical ? 'right-0 bottom-0 left-0 w-full' : 'top-0 left-0 h-full',
          fillClassName,
        )}
        initial={false}
        animate={isVertical ? { height: `${safeValue}%` } : { width: `${safeValue}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
      {showThumb ? (
        <motion.span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute rounded-sm bg-current',
            isVertical
              ? 'left-1/2 h-1.5 w-3 -translate-x-1/2 translate-y-1/2'
              : 'top-1/2 h-3 w-1.5 -translate-x-1/2 -translate-y-1/2',
            thumbClassName,
          )}
          initial={false}
          animate={isVertical ? { bottom: `${safeValue}%` } : { left: `${safeValue}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      ) : null}
    </div>
  )
}
