import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, type HTMLAttributes, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'
import { lockBodyScroll, OVERLAY_FOCUSABLE } from '../../lib/useFullscreen'
import { Icon } from '../icon'
import type { MediaAsset } from './types'

export type GalleryGridProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  assets: readonly MediaAsset[]
  onSelect?(index: number, asset: MediaAsset): void
}

export function GalleryGrid({ assets, onSelect, className, ...props }: GalleryGridProps) {
  return (
    <div data-tint-gallery-grid="" className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3', className)} {...props}>
      {assets.map((asset, index) => (
        <button key={asset.id} type="button" className="overflow-hidden rounded-lg bg-tint-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent" onClick={() => onSelect?.(index, asset)}>
          <img src={asset.src} alt={asset.alt} width={asset.width} height={asset.height} className="aspect-square size-full object-cover" />
        </button>
      ))}
    </div>
  )
}

export type MediaLightboxProps = {
  open: boolean
  assets: readonly MediaAsset[]
  index: number
  onClose(): void
  onIndexChange(index: number): void
  className?: string
}

export function MediaLightbox({ open, assets, index, onClose, onIndexChange, className }: MediaLightboxProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<number | null>(null)
  const safeIndex = assets.length === 0 ? 0 : Math.min(Math.max(0, index), assets.length - 1)
  const current = assets[safeIndex]
  const previous = useCallback(() => { if (safeIndex > 0) onIndexChange(safeIndex - 1) }, [safeIndex, onIndexChange])
  const next = useCallback(() => { if (safeIndex < assets.length - 1) onIndexChange(safeIndex + 1) }, [safeIndex, assets.length, onIndexChange])

  useEffect(() => {
    if (!open) return
    const container = panelRef.current
    const restore = document.activeElement as HTMLElement | null
    const unlock = lockBodyScroll()
    container?.focus()
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); previous() }
      else if (event.key === 'ArrowRight') { event.preventDefault(); next() }
      else if (event.key === 'Tab' && container) {
        const focusable = [...container.querySelectorAll<HTMLElement>(OVERLAY_FOCUSABLE)]
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!first || !last) event.preventDefault()
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      }
    }
    document.addEventListener('keydown', keyDown)
    return () => { document.removeEventListener('keydown', keyDown); unlock(); restore?.focus?.() }
  }, [open, onClose, previous, next])

  const touchEnd = (event: TouchEvent) => {
    const start = touchStart.current
    const end = event.changedTouches[0]?.clientX
    touchStart.current = null
    if (start == null || end == null || Math.abs(end - start) < 45) return
    if (end < start) next(); else previous()
  }

  if (!open || !current || typeof document === 'undefined') return null
  return createPortal(
    <div role="presentation" data-tint-media-lightbox="" className={cn('fixed inset-0 z-50 flex items-center justify-center bg-tint-ink/70 p-4 backdrop-blur-sm', className)} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-tint-border bg-tint-panel shadow-lg outline-none" onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null }} onTouchEnd={touchEnd}>
        <button type="button" onClick={onClose} aria-label="Close" className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-lg bg-tint-surface"><Icon icon={X} /></button>
        {safeIndex > 0 ? <button type="button" onClick={previous} aria-label="Previous" className="absolute top-1/2 left-3 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-lg bg-tint-surface"><Icon icon={ChevronLeft} /></button> : null}
        {safeIndex < assets.length - 1 ? <button type="button" onClick={next} aria-label="Next" className="absolute top-1/2 right-3 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-lg bg-tint-surface"><Icon icon={ChevronRight} /></button> : null}
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <img src={current.src} alt={current.alt} width={current.width} height={current.height} className="mx-auto max-h-[70vh] w-full object-contain" />
          <h2 id={titleId} className="mt-4 text-base font-semibold text-tint-ink">{(current.caption ?? current.alt) || 'Media preview'}</h2>
          {assets.length > 1 ? <p className="text-xs text-tint-muted">{safeIndex + 1} of {assets.length}</p> : null}
          {current.href ? <a href={current.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-tint-accent"><Icon icon={ExternalLink} size="sm" />View original</a> : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
