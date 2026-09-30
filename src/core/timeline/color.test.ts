import { describe, expect, it, vi } from 'vitest'
import { observeCanvasTheme, resolveCanvasColor } from './color'

describe('timeline canvas colors', () => {
  it('resolves semantic Tint variables into a canvas-compatible color', () => {
    const canvas = document.createElement('canvas')
    canvas.style.setProperty('--tint-accent', '#4fd1a5')
    expect(resolveCanvasColor(canvas, 'var(--tint-accent)')).toBe('#4fd1a5')
    expect(resolveCanvasColor(canvas, '#123456')).toBe('#123456')
  })

  it('observes theme changes on ancestors and stops after cleanup', async () => {
    const host = document.createElement('div')
    const canvas = document.createElement('canvas')
    host.append(canvas)
    document.body.append(host)
    const redraw = vi.fn()
    const stop = observeCanvasTheme(canvas, redraw)
    host.dataset.theme = 'macchiato'
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(redraw).toHaveBeenCalledOnce()
    stop()
    host.dataset.theme = 'latte'
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(redraw).toHaveBeenCalledOnce()
    host.remove()
  })
})
