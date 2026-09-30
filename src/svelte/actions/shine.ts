import type { Action } from 'svelte/action'

/**
 * Pointer-tracking highlight. Writes `--tint-shine-x/y` on the element; the
 * visual is pure CSS (src/styles/effects/shine.css) keyed on `data-shine`.
 *
 * Deliberately small: listeners live on the element only (no document-level
 * mousemove), there is no rAF loop, and the bounding rect is read once per
 * pointerenter, not per move. Touch pointers and `prefers-reduced-motion` are
 * ignored, so the effect is inert there rather than merely hidden.
 */
export const shine: Action<HTMLElement, { disabled?: boolean } | undefined> = (node, options) => {
  let disabled = options?.disabled ?? false
  let rect: DOMRect | undefined

  const reduced = () =>
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

  const enter = (event: PointerEvent) => {
    if (disabled || event.pointerType === 'touch' || reduced()) return
    rect = node.getBoundingClientRect()
  }

  const move = (event: PointerEvent) => {
    if (!rect || event.pointerType === 'touch') return
    node.style.setProperty('--tint-shine-x', `${event.clientX - rect.left}px`)
    node.style.setProperty('--tint-shine-y', `${event.clientY - rect.top}px`)
  }

  const leave = () => {
    rect = undefined
  }

  node.setAttribute('data-shine', '')
  node.addEventListener('pointerenter', enter)
  node.addEventListener('pointermove', move)
  node.addEventListener('pointerleave', leave)

  return {
    update(next) {
      disabled = next?.disabled ?? false
      if (disabled) rect = undefined
    },
    destroy() {
      node.removeEventListener('pointerenter', enter)
      node.removeEventListener('pointermove', move)
      node.removeEventListener('pointerleave', leave)
      node.removeAttribute('data-shine')
      node.style.removeProperty('--tint-shine-x')
      node.style.removeProperty('--tint-shine-y')
    },
  }
}
