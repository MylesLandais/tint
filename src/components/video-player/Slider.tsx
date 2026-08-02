import { useRef, type PointerEvent } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

export type SliderProps = {
  value: number
  onChange: (value: number) => void
  className?: string
  orientation?: 'horizontal' | 'vertical'
  'aria-label': string
}

export function Slider({
  value,
  onChange,
  className,
  orientation = 'horizontal',
  'aria-label': ariaLabel,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const isVertical = orientation === 'vertical'

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
      aria-valuenow={Math.round(value)}
      className={cn(
        'relative cursor-pointer rounded-full bg-white/20 outline-none focus-visible:ring-2 focus-visible:ring-white/60',
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
          onChange(Math.min(value + 5, 100))
        }
        if (decrease) {
          event.preventDefault()
          onChange(Math.max(value - 5, 0))
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
          'absolute rounded-full bg-white',
          isVertical ? 'right-0 bottom-0 left-0 w-full' : 'top-0 left-0 h-full',
        )}
        initial={false}
        animate={isVertical ? { height: `${value}%` } : { width: `${value}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    </div>
  )
}
