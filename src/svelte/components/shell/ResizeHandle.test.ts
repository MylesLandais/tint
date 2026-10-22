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
