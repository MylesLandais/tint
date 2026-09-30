export type OverlaySide = 'top' | 'right' | 'bottom' | 'left'
export type Rect = { top: number; right: number; bottom: number; left: number; width: number; height: number }
export type Size = { width: number; height: number }

/** Fixed-position coordinates for a portaled overlay, with a preferred-side flip. */
export function positionOverlay(
  anchor: Rect,
  overlay: Size,
  viewport: Size,
  preferredSide: OverlaySide = 'bottom',
  gap = 8,
  margin = 8,
): { top: number; left: number; side: OverlaySide } {
  let side = preferredSide
  if (side === 'bottom' && anchor.bottom + gap + overlay.height > viewport.height - margin && anchor.top - gap - overlay.height >= margin) side = 'top'
  else if (side === 'top' && anchor.top - gap - overlay.height < margin && anchor.bottom + gap + overlay.height <= viewport.height - margin) side = 'bottom'
  else if (side === 'right' && anchor.right + gap + overlay.width > viewport.width - margin && anchor.left - gap - overlay.width >= margin) side = 'left'
  else if (side === 'left' && anchor.left - gap - overlay.width < margin && anchor.right + gap + overlay.width <= viewport.width - margin) side = 'right'

  const rawTop = side === 'bottom' ? anchor.bottom + gap : side === 'top' ? anchor.top - overlay.height - gap : anchor.top
  const rawLeft = side === 'right' ? anchor.right + gap : side === 'left' ? anchor.left - overlay.width - gap : anchor.left
  return {
    top: Math.max(margin, Math.min(rawTop, viewport.height - overlay.height - margin)),
    left: Math.max(margin, Math.min(rawLeft, viewport.width - overlay.width - margin)),
    side,
  }
}
