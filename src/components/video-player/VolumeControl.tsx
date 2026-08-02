import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Volume1, Volume2, VolumeX } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { useDismissable } from '@/lib/useDismissable'
import { Slider } from './Slider'

export type VolumeControlProps = {
  volume: number
  isMuted: boolean
  onVolumeChange: (value: number) => void
  onToggleMute: () => void
  onOpenChange?: (open: boolean) => void
  className?: string
}

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(Math.round(value), 0), 100)
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
  const inputRef = useRef<HTMLInputElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('100')
  const displayVolume = isMuted ? 0 : volume * 100
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume > 0.5 ? Volume2 : Volume1

  useEffect(() => {
    if (!editing) {
      setInputValue(String(Math.round(displayVolume)))
    }
  }, [displayVolume, editing])

  const clearCloseTimer = () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }

  const setDrawerOpen = (next: boolean) => {
    setOpen(next)
    onOpenChange?.(next)
    if (!next) {
      setEditing(false)
    }
  }

  const openDrawer = () => {
    clearCloseTimer()
    setDrawerOpen(true)
  }

  const scheduleClose = () => {
    if (editing) return
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => setDrawerOpen(false), 160)
  }

  const commitInputValue = () => {
    const parsed = clampVolume(Number(inputValue))
    setInputValue(String(parsed))
    onVolumeChange(parsed)
    setEditing(false)
  }

  useEffect(() => () => clearCloseTimer(), [])

  useDismissable(open, rootRef, {
    onPointerDownOutside: () => {
      if (editing) commitInputValue()
      setDrawerOpen(false)
    },
    onEscapeKeyDown: () => {
      if (editing) {
        setInputValue(String(Math.round(displayVolume)))
        setEditing(false)
        inputRef.current?.blur()
        return
      }
      setDrawerOpen(false)
    },
  })

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitInputValue()
      inputRef.current?.blur()
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const next = clampVolume(Number(inputValue || displayVolume) + 1)
      setInputValue(String(next))
      onVolumeChange(next)
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = clampVolume(Number(inputValue || displayVolume) - 1)
      setInputValue(String(next))
      onVolumeChange(next)
    }
  }

  const onInputSubmit = (event: FormEvent) => {
    event.preventDefault()
    commitInputValue()
  }

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
          'inline-flex size-8 items-center justify-center rounded-md text-white transition-colors hover:bg-[#111111d1]',
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
            className="absolute bottom-[calc(100%+0.75rem)] left-1/2 z-30 flex h-36 w-14 -translate-x-1/2 flex-col items-center rounded-xl border border-white/10 bg-[#14161ccc] px-2 pt-2 pb-3 shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <form onSubmit={onInputSubmit} className="mb-2.5 w-full">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputValue}
                aria-label="Volume percentage"
                onFocus={() => {
                  setEditing(true)
                  openDrawer()
                }}
                onBlur={commitInputValue}
                onChange={(event) => {
                  const next = event.target.value.replace(/[^\d]/g, '').slice(0, 3)
                  setEditing(true)
                  setInputValue(next)
                }}
                onKeyDown={onInputKeyDown}
                className="w-full border-0 border-b border-white/35 bg-transparent px-0.5 py-0.5 text-center text-[11px] font-medium text-white tabular-nums outline-none placeholder:text-white/35 focus:border-white/70"
              />
            </form>
            <div className="flex min-h-0 w-full flex-1 justify-center">
              <Slider
                orientation="vertical"
                value={displayVolume}
                onChange={(value) => {
                  setEditing(false)
                  onVolumeChange(value)
                }}
                aria-label="Volume"
                className="h-full"
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
