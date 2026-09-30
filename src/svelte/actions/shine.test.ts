import { afterEach, describe, expect, it, vi } from 'vitest'
import { shine } from './shine'

function setup(options?: { disabled?: boolean }) {
  const node = document.createElement('div')
  vi.spyOn(node, 'getBoundingClientRect').mockReturnValue({
    left: 10, top: 20, width: 100, height: 50, right: 110, bottom: 70, x: 10, y: 20, toJSON() {},
  })
  const action = shine(node, options)!
  return { node, action }
}

function pointer(node: HTMLElement, type: string, init: MouseEventInit & { pointerType?: string } = {}) {
  const event = new MouseEvent(type, { bubbles: true, ...init })
  Object.defineProperty(event, 'pointerType', { value: init.pointerType ?? 'mouse' })
  node.dispatchEvent(event)
}

afterEach(() => vi.unstubAllGlobals())

describe('shine action', () => {
  it('opts the element in and writes pointer position relative to it', () => {
    const { node } = setup()
    expect(node).toHaveAttribute('data-shine')
    pointer(node, 'pointerenter')
    pointer(node, 'pointermove', { clientX: 60, clientY: 45 })
    expect(node.style.getPropertyValue('--tint-shine-x')).toBe('50px')
    expect(node.style.getPropertyValue('--tint-shine-y')).toBe('25px')
  })

  it('reads layout once per enter, not per move', () => {
    const { node } = setup()
    pointer(node, 'pointerenter')
    pointer(node, 'pointermove', { clientX: 20, clientY: 30 })
    pointer(node, 'pointermove', { clientX: 30, clientY: 40 })
    expect(node.getBoundingClientRect).toHaveBeenCalledTimes(1)
  })

  it('ignores touch pointers', () => {
    const { node } = setup()
    pointer(node, 'pointerenter', { pointerType: 'touch' })
    pointer(node, 'pointermove', { clientX: 60, clientY: 45, pointerType: 'touch' })
    expect(node.style.getPropertyValue('--tint-shine-x')).toBe('')
  })

  it('is inert under prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const { node } = setup()
    pointer(node, 'pointerenter')
    pointer(node, 'pointermove', { clientX: 60, clientY: 45 })
    expect(node.style.getPropertyValue('--tint-shine-x')).toBe('')
  })

  it('can be disabled via update and cleans up on destroy', () => {
    const { node, action } = setup()
    action.update?.({ disabled: true })
    pointer(node, 'pointerenter')
    pointer(node, 'pointermove', { clientX: 60, clientY: 45 })
    expect(node.style.getPropertyValue('--tint-shine-x')).toBe('')

    action.update?.({ disabled: false })
    pointer(node, 'pointerenter')
    pointer(node, 'pointermove', { clientX: 60, clientY: 45 })
    expect(node.style.getPropertyValue('--tint-shine-x')).toBe('50px')

    action.destroy?.()
    expect(node).not.toHaveAttribute('data-shine')
    expect(node.style.getPropertyValue('--tint-shine-x')).toBe('')
    pointer(node, 'pointermove', { clientX: 70, clientY: 45 })
    expect(node.style.getPropertyValue('--tint-shine-x')).toBe('')
  })
})
