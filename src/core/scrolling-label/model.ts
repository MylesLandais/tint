/** Scroll speed of the forward pass, in pixels per second. */
export const SCROLL_PX_PER_SECOND = 40
/** Mirrors the forward keyframe share in src/index.css. */
export const FORWARD_SHARE = 0.35
/** A small overflow must not produce a frantic animation. */
export const MIN_CYCLE_SECONDS = 3

export function overflowDistance(containerWidth: number, contentWidth: number): number {
  return Math.max(0, contentWidth - containerWidth)
}

export function scrollCycleSeconds(overflowPx: number): number {
  return Math.max(overflowPx / SCROLL_PX_PER_SECOND / FORWARD_SHARE, MIN_CYCLE_SECONDS)
}
