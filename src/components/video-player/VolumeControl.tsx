import { useEffect, useRef, useState } from 'react'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { Slider } from './Slider'

export type VolumeControlProps = {
  volume: number
  isMuted: boolean
  onVolumeChange: (value: number) => void
  onToggleMute: () => void
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  onOpenChange,
  className,
}: VolumeControlProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const onOpenChangeRef = useRef(onOpenChange)
  const [open, setOpen] = useState(false)
  const displayVolume = isMuted ? 0 : volume * 100
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume > 0.5 ? Volume2 : Volume1

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange
  }, [onOpenChange])

  const clearCloseTimer = () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const setDrawerOpen = (next: boolean) => {
    setOpen(next)
    onOpenChangeRef.current?.(next)
  }

  const openDrawer = () => {
    clearCloseTimer()
    setDrawerOpen(true)
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => setDrawerOpen(false), 160)
  }

  useEffect(() => () => clearCloseTimer(), [])

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        onOpenChangeRef.current?.(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        onOpenChangeRef.current?.(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      onMouseEnter={openDrawer}
      onMouseLeave={scheduleClose}
      onFocusCapture={openDrawer}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          scheduleClose()
        }
      }}
    >
      <motion.button
        type="button"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={onToggleMute}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
        aria-expanded={open}
        aria-controls="tint-volume-drawer"
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-[#111111d1]',
          open && 'bg-[#111111d1]',
        )}
      >
        <VolumeIcon className="size-4" />
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="tint-volume-drawer"
            role="dialog"
            aria-label="Volume"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute bottom-[calc(100%+0.4rem)] left-1/2 z-30 flex h-28 w-10 -translate-x-1/2 flex-col items-center rounded-2xl border border-white/10 bg-[#14161ccc] px-2 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="mb-2 text-[10px] font-medium text-white/55 tabular-nums">
              {Math.round(displayVolume)}
            </span>
            <Slider
              orientation="vertical"
              value={displayVolume}
              onChange={onVolumeChange}
              aria-label="Volume"
              className="flex-1"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
