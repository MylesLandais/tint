import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

/** Scroll speed of the forward pass, in pixels per second. */
const SCROLL_PX_PER_SECOND = 40
/**
 * Share of one animation cycle spent scrolling forward — mirrors the keyframes
 * in `src/index.css` (`@keyframes tint-scrolling-label`), cross-referenced
 * rather than shared because there is no build-time sharing between TS and CSS
 * in this repo.
 */
const FORWARD_SHARE = 0.35
/** Floor for a full cycle, so a 2px overflow does not whip back and forth. */
const MIN_CYCLE_SECONDS = 3

export type ScrollingLabelProps = HTMLAttributes<HTMLSpanElement> & {
  /** Single-line text. Marquees only when it overflows the container. */
  text: string
}

/**
 * Single-line label that marquees only when the text overflows.
 *
 * The scroll itself is CSS (`@keyframes tint-scrolling-label` in
 * `src/index.css`), driven by two custom properties set here from the measured
 * overflow distance; this component only decides *whether* the text overflows
 * and stamps the distance. Keeping the motion in CSS is what makes the hard
 * behaviour guarantees declarative: the 1.5s start delay is the animation
 * delay, and the `:hover`/`:focus-within` rule removes the animation outright,
 * which both pauses and resets the offset so the title stays readable and
 * clickable. `prefers-reduced-motion` disables the animation and falls back to
 * a static ellipsis.
 *
 * The DOM always carries the full text (clipped, not truncated), so assistive
 * tech reads it whole; the `title` default makes it reachable on hover too.
 */
export function ScrollingLabel({ text, className, title, ...props }: ScrollingLabelProps) {
  const containerRef = useRef<HTMLSpanElement>(null)
  const contentRef = useRef<HTMLSpanElement>(null)
  const [overflowPx, setOverflowPx] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return
    const measure = () => {
      const distance = content.offsetWidth - container.clientWidth
      const next = distance > 0 ? distance : 0
      setOverflowPx((prev) => (prev === next ? prev : next))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    observer.observe(content)
    return () => observer.disconnect()
  }, [text])

  const overflowing = overflowPx > 0
  const cycleSeconds = Math.max(overflowPx / SCROLL_PX_PER_SECOND / FORWARD_SHARE, MIN_CYCLE_SECONDS)

  return (
    <span
      ref={containerRef}
      data-scrolling-label=""
      data-overflowing={overflowing ? '' : undefined}
      title={title ?? text}
      className={cn('block max-w-full overflow-hidden whitespace-nowrap', className)}
      {...props}
    >
      <span
        // Keying on the text remounts the animated node on every change, which
        // resets the scroll offset to zero and restarts the animation delay —
        // a new title holds still, then starts scrolling.
        key={text}
        ref={contentRef}
        data-scrolling-label-content=""
        className="inline-block"
        style={
          overflowing
            ? ({
                '--tint-scrolling-label-distance': `${overflowPx}px`,
                '--tint-scrolling-label-duration': `${cycleSeconds}s`,
              } as CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </span>
  )
}
