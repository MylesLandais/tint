import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import ResizeHandle from './ResizeHandle.svelte'

describe('controlled resize handle', () => {
  it('emits bounded reversed keyboard changes and keeps host ownership', async () => {
    const onSizeChange = vi.fn()
    const { rerender } = render(ResizeHandle, { label: 'Inspector width', size: 380, minSize: 280, maxSize: 480, primary: 'second', shiftStep: 40, onSizeChange })
    const handle = screen.getByRole('separator', { name: 'Inspector width' })
    await fireEvent.keyDown(handle, { key: 'ArrowLeft', shiftKey: true })
    expect(onSizeChange).toHaveBeenLastCalledWith(420)
    expect(handle).toHaveAttribute('aria-valuenow', '380')
    await rerender({ label: 'Inspector width', size: 420, minSize: 280, maxSize: 480, primary: 'second', onSizeChange })
    expect(handle).toHaveAttribute('aria-valuenow', '420')
    await fireEvent.keyDown(handle, { key: 'End' })
    expect(onSizeChange).toHaveBeenLastCalledWith(480)
    await fireEvent.keyDown(handle, { key: 'Home' })
    expect(onSizeChange).toHaveBeenLastCalledWith(280)
  })
  it('tracks only the captured pointer and ends a cancelled drag', async () => {
    const onSizeChange = vi.fn()
    render(ResizeHandle, { label: 'Pane height', size: 100, maxSize: 200, direction: 'vertical', onSizeChange })
    const handle = screen.getByRole('separator')
    const capture = vi.fn(), release = vi.fn()
    handle.setPointerCapture = capture
    handle.hasPointerCapture = () => true
    handle.releasePointerCapture = release
    const pointer = async (type: string, id: number, y: number) => {
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.assign(event, { pointerId: id, clientY: y, button: 0 })
      await fireEvent(handle, event)
    }
    await pointer('pointerdown', 1, 10)
    await pointer('pointermove', 2, 90)
    expect(onSizeChange).not.toHaveBeenCalled()
    await pointer('pointermove', 1, 150)
    expect(onSizeChange).toHaveBeenLastCalledWith(200)
    expect(capture).toHaveBeenCalledWith(1)
    await pointer('pointercancel', 1, 150)
    expect(release).toHaveBeenCalledWith(1)
    onSizeChange.mockClear()
    await pointer('pointermove', 1, 30)
    expect(onSizeChange).not.toHaveBeenCalled()
  })
  it('disables keyboard intent and ignores keys on the other axis', async () => {
    const onSizeChange = vi.fn()
    const { rerender } = render(ResizeHandle, { label: 'Width', size: 100, onSizeChange })
    const handle = screen.getByRole('separator')
    await fireEvent.keyDown(handle, { key: 'ArrowDown' })
    expect(onSizeChange).not.toHaveBeenCalled()
    await rerender({ label: 'Width', size: 100, disabled: true, onSizeChange })
    await fireEvent.keyDown(handle, { key: 'End' })
    expect(onSizeChange).not.toHaveBeenCalled()
  })
})

describe('resize interaction lifetime', () => {
  async function pointer(handle: HTMLElement, type: string, id: number, x = 10) {
    const event = new Event(type, { bubbles: true, cancelable: true })
    Object.assign(event, { pointerId: id, clientX: x, button: 0 })
    await fireEvent(handle, event)
  }
  function capture(handle: HTMLElement) {
    const release = vi.fn()
    handle.setPointerCapture = vi.fn()
    handle.hasPointerCapture = () => true
    handle.releasePointerCapture = release
    return release
  }
  it('reports one active interval for the captured pointer and keeps keyboard intent outside it', async () => {
    const onResizingChange = vi.fn(), onSizeChange = vi.fn()
    const props = { label: 'Width', size: 100, onSizeChange, onResizingChange }
    render(ResizeHandle, props)
    const handle = screen.getByRole('separator'); const release = capture(handle)
    await pointer(handle, 'pointerdown', 3)
    expect(onResizingChange.mock.calls).toEqual([[true]])
    await pointer(handle, 'lostpointercapture', 4)
    await pointer(handle, 'pointermove', 3, 30)
    expect(onSizeChange).toHaveBeenLastCalledWith(120)
    await pointer(handle, 'pointerup', 3)
    await pointer(handle, 'lostpointercapture', 3)
    expect(onResizingChange.mock.calls).toEqual([[true], [false]])
    expect(release).toHaveBeenCalledOnce()
    await fireEvent.keyDown(handle, { key: 'ArrowRight' })
    expect(onSizeChange).toHaveBeenLastCalledWith(110)
    expect(onResizingChange).toHaveBeenCalledTimes(2)
  })
  it('releases and ends capture when disabled, ignoring later input', async () => {
    const onResizingChange = vi.fn(), onSizeChange = vi.fn()
    const props = { label: 'Width', size: 100, onSizeChange, onResizingChange }
    const view = render(ResizeHandle, props)
    const handle = screen.getByRole('separator'); const release = capture(handle)
    await pointer(handle, 'pointerdown', 3)
    await view.rerender({ ...props, disabled: true })
    expect(onResizingChange.mock.calls).toEqual([[true], [false]])
    expect(release).toHaveBeenCalledWith(3)
    await pointer(handle, 'pointermove', 3, 30)
    expect(onSizeChange).not.toHaveBeenCalled()
  })
  it('ends an interrupted owner on axis change and destruction without duplicate final callbacks', async () => {
    const onResizingChange = vi.fn(), onSizeChange = vi.fn()
    const props = { label: 'Width', size: 100, onSizeChange, onResizingChange }
    const view = render(ResizeHandle, props)
    const handle = screen.getByRole('separator'); const release = capture(handle)
    await pointer(handle, 'pointerdown', 3)
    await view.rerender({ ...props, direction: 'vertical' })
    expect(onResizingChange.mock.calls).toEqual([[true], [false]])
    await pointer(handle, 'pointerdown', 5)
    await view.unmount()
    expect(onResizingChange.mock.calls).toEqual([[true], [false], [true], [false]])
    expect(release.mock.calls).toEqual([[3], [5]])
  })
})
