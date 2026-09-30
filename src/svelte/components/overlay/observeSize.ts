/** Observe both sides of a portaled overlay so layout changes update its position. */
export function observeOverlaySize(
  anchor: HTMLElement | undefined,
  overlay: HTMLElement | undefined,
  reposition: () => void,
): () => void {
  if (typeof ResizeObserver === 'undefined') return () => {}
  const observer = new ResizeObserver(reposition)
  if (anchor) observer.observe(anchor)
  if (overlay) observer.observe(overlay)
  return () => observer.disconnect()
}
