import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/svelte'
import AnnotationCanvas from './AnnotationCanvas.svelte'

const image = { id: 'frame', url: 'frame.png', width: 400, height: 200 }

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype as { getContext(contextId: '2d'): CanvasRenderingContext2D | null }, 'getContext')
    .mockReturnValue({ clearRect: vi.fn() } as unknown as CanvasRenderingContext2D)
  vi.spyOn(SVGElement.prototype, 'getBoundingClientRect')
    .mockReturnValue({ left: 0, top: 0, width: 200, height: 100 } as DOMRect)
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.hasPointerCapture = () => false
})
afterEach(() => vi.restoreAllMocks())

describe('Svelte AnnotationCanvas', () => {
  it('emits normalized box geometry with controlled host callbacks', async () => {
    const onCreate = vi.fn()
    render(AnnotationCanvas, { image, regions: [], tool: 'box', zoom: .5,
      onSelect: vi.fn(), onCreate, onGeometryChange: vi.fn() })
    const editor = screen.getByRole('application')
    await fireEvent.pointerDown(editor, { button: 0, pointerId: 1, clientX: 20, clientY: 10 })
    await fireEvent.pointerMove(editor, { pointerId: 1, clientX: 100, clientY: 60 })
    await fireEvent.pointerUp(editor, { pointerId: 1, clientX: 100, clientY: 60 })
    expect(onCreate).toHaveBeenCalledWith({ kind: 'box', x: .1, y: .1, width: .4, height: .5 })
  })

  it('completes a polygon only on Enter and can cancel with Escape', async () => {
    const onCreate = vi.fn()
    render(AnnotationCanvas, { image, regions: [], tool: 'polygon',
      onSelect: vi.fn(), onCreate, onGeometryChange: vi.fn() })
    const editor = screen.getByRole('application')
    for (const [x, y] of [[20, 10], [100, 10], [100, 60]]) await fireEvent.pointerDown(editor, { button: 0, clientX: x, clientY: y })
    expect(onCreate).not.toHaveBeenCalled()
    await fireEvent.keyDown(editor, { key: 'Escape' })
    await fireEvent.keyDown(editor, { key: 'Enter' })
    expect(onCreate).not.toHaveBeenCalled()
    for (const [x, y] of [[20, 10], [100, 10], [100, 60]]) await fireEvent.pointerDown(editor, { button: 0, clientX: x, clientY: y })
    await fireEvent.keyDown(editor, { key: 'Enter' })
    expect(onCreate).toHaveBeenCalledWith({ kind: 'polygon', points: [{ x: .1, y: .1 }, { x: .5, y: .1 }, { x: .5, y: .6 }] })
  })

  it('reports delete intent for the selected region', async () => {
    const onDelete = vi.fn()
    render(AnnotationCanvas, { image, regions: [{ id: 'box', label: 'Object', geometry: { kind: 'box', x: .1, y: .1, width: .2, height: .2 } }],
      selectedId: 'box', tool: 'select', onSelect: vi.fn(), onCreate: vi.fn(), onGeometryChange: vi.fn(), onDelete })
    await fireEvent.keyDown(screen.getByRole('application'), { key: 'Delete' })
    expect(onDelete).toHaveBeenCalledWith('box')
  })

  it('offers keyboard-reachable region selection outside the hidden drawing SVG', async () => {
    const onSelect = vi.fn()
    render(AnnotationCanvas, { image, regions: [
      { id: 'a', label: 'First object', tone: 'proposal', geometry: { kind: 'box', x: .1, y: .1, width: .2, height: .2 } },
      { id: 'b', label: 'Second object', geometry: { kind: 'box', x: .4, y: .1, width: .2, height: .2 } },
    ], selectedId: 'a', tool: 'select', onSelect, onCreate: vi.fn(), onGeometryChange: vi.fn() })
    const first = screen.getByRole('button', { name: 'First object · proposal' })
    const second = screen.getByRole('button', { name: 'Second object' })
    expect(first).toHaveAttribute('aria-pressed', 'true')
    second.focus()
    await fireEvent.keyDown(second, { key: 'Enter' })
    await fireEvent.click(second)
    expect(onSelect).toHaveBeenCalledWith('b')
  })
})
