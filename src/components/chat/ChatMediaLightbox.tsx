import { ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'
import { lockBodyScroll, OVERLAY_FOCUSABLE } from '../../lib/useFullscreen'
import { Icon } from '../icon'
import { safeHref, stripBidi } from './sanitize'
import type { ChatMediaLightboxProps } from './types'

/**
 * Full-viewport image viewer for chat galleries.
 *
 * Controlled API mirrors Bunny’s `MediaLightbox`: the host owns open state and
 * the current index; this component only presents and reports intent. Theater-
 * grade a11y (scroll lock, focus restore, Tab cycle, `aria-modal`) follows the
 * same patterns as `useFullscreen`’s in-page fallback.
 */
export function ChatMediaLightbox({
  open,
  images,
  index,
  onClose,
  onIndexChange,
  caption,
  className,
}: ChatMediaLightboxProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const safeIndex =
    images.length === 0 ? 0 : Math.min(Math.max(0, index), images.length - 1)
  const current = images[safeIndex]
  const hasPrevious = safeIndex > 0
  const hasNext = safeIndex < images.length - 1
  const originalHref = safeHref(current?.href)

  useEffect(() => {
    if (!open) return
    const container = panelRef.current
    const restoreTo = document.activeElement as HTMLElement | null
    const releaseScroll = lockBodyScroll()
    container?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowLeft' && hasPrevious) {
        event.preventDefault()
        onIndexChange(safeIndex - 1)
        return
      }
      if (event.key === 'ArrowRight' && hasNext) {
        event.preventDefault()
        onIndexChange(safeIndex + 1)
        return
      }
      if (event.key !== 'Tab' || !container) return
      const focusable = [...container.querySelectorAll<HTMLElement>(OVERLAY_FOCUSABLE)].filter(
        (node) => node.offsetParent !== null || node === document.activeElement,
      )
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]!
      const last = focusable[focusable.length - 1]!
      const active = document.activeElement
      if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      releaseScroll()
      restoreTo?.focus?.()
    }
  }, [open, hasPrevious, hasNext, onClose, onIndexChange, safeIndex])

  if (!open || !current || typeof document === 'undefined') return null

  const alt = stripBidi(current.alt)
  const label = caption ? stripBidi(caption) : alt || 'Image preview'

  return createPortal(
    <div
      data-chat-lightbox=""
      role="presentation"
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-tint-ink/70 p-4 backdrop-blur-sm',
        className,
      )}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-tint-border bg-tint-panel shadow-lg outline-none"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 inline-flex size-10 items-center justify-center rounded-lg border border-tint-border bg-tint-surface text-tint-ink hover:bg-tint-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
        >
          <Icon icon={X} />
        </button>

        {hasPrevious ? (
          <button
            type="button"
            onClick={() => onIndexChange(safeIndex - 1)}
            aria-label="Previous"
            className="absolute top-1/2 left-3 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-lg border border-tint-border bg-tint-surface text-tint-ink hover:bg-tint-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
          >
            <Icon icon={ChevronLeft} />
          </button>
        ) : null}

        {hasNext ? (
          <button
            type="button"
            onClick={() => onIndexChange(safeIndex + 1)}
            aria-label="Next"
            className="absolute top-1/2 right-3 z-10 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-lg border border-tint-border bg-tint-surface text-tint-ink hover:bg-tint-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
          >
            <Icon icon={ChevronRight} />
          </button>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          <img
            src={current.src}
            alt={alt}
            width={current.width}
            height={current.height}
            className="mx-auto max-h-[70vh] w-full object-contain"
          />

          <div className="mt-4 space-y-2">
            <h2 id={titleId} className="m-0 text-base font-semibold text-tint-ink">
              {label}
            </h2>
            {images.length > 1 ? (
              <p className="m-0 text-xs text-tint-muted">
                {safeIndex + 1} of {images.length}
              </p>
            ) : null}
            {originalHref ? (
              <a
                href={originalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-tint-accent px-3 py-2 text-sm font-medium text-tint-on-accent hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint-accent"
              >
                <Icon icon={ExternalLink} size="sm" />
                View original
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
