import { fireEvent, render, screen } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import { createMockTileMap, renderTileMap } from '../../../core/tile-map'
import TileMapViewport from './TileMapViewport.svelte'

vi.mock('../../../core/tile-map/viewport', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../../core/tile-map/viewport')>(),
  renderTileMap: vi.fn(),
}))

describe('Svelte TileMapViewport', () => {
  it('renders the host map and reports valid movement and interaction', async () => {
    const document = createMockTileMap()
    const onMove = vi.fn()
    const onInteract = vi.fn()
    render(TileMapViewport, { document, player: { x: 12, y: 8 }, onMove, onInteract })
    const map = screen.getByRole('button', { name: 'Game map' })
    expect(map.querySelector('canvas')).toBeInTheDocument()
    expect(renderTileMap).toHaveBeenCalledWith(expect.any(HTMLCanvasElement), document, { x: 12, y: 8 }, expect.any(Number))
    await fireEvent.keyDown(map, { key: 'ArrowRight' })
    expect(onMove).toHaveBeenCalledWith('right')
    await fireEvent.keyDown(map, { key: 'e' })
    expect(onInteract).toHaveBeenCalledOnce()
  })

  it('does not forward a blocked move', async () => {
    const onMove = vi.fn()
    render(TileMapViewport, { document: createMockTileMap(), player: { x: 1, y: 1 }, onMove })
    await fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowLeft' })
    expect(onMove).not.toHaveBeenCalled()
  })
})
