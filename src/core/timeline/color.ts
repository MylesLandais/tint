/** Resolve CSS token colors before assigning them to CanvasRenderingContext2D. */
export function resolveCanvasColor(canvas: HTMLCanvasElement, color: string): string {
  if (!color.includes('var(')) return color
  const probe = document.createElement('span')
  probe.style.color = color
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  ;(canvas.parentElement ?? canvas).append(probe)
  const computed = getComputedStyle(probe).color
  probe.remove()
  if (computed && computed !== color) return computed

  const token = /^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/.exec(color.trim())
  if (!token) return color
  return getComputedStyle(canvas).getPropertyValue(token[1]).trim() || token[2]?.trim() || color
}

/** Redraw canvases when a theme token changes on any ancestor. */
export function observeCanvasTheme(canvas: HTMLCanvasElement, redraw: () => void): () => void {
  const observer = new MutationObserver(redraw)
  let current: HTMLElement | null = canvas
  while (current) {
    observer.observe(current, { attributes: true, attributeFilter: ['data-theme', 'data-scheme', 'class', 'style'] })
    current = current.parentElement
  }
  const scheme = window.matchMedia?.('(prefers-color-scheme: dark)')
  scheme?.addEventListener('change', redraw)
  return () => {
    observer.disconnect()
    scheme?.removeEventListener('change', redraw)
  }
}
