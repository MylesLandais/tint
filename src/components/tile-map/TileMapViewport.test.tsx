import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TileMapViewport, createMockTileMap } from './index'

describe('TileMapViewport', () => {
  it('renders an accessible map surface and forwards valid movement', () => {
    const onMove = vi.fn()
    render(<TileMapViewport document={createMockTileMap()} player={{ x: 12, y: 8 }} onMove={onMove} />)
    const map = screen.getByRole('button', { name: 'Game map' })
    fireEvent.keyDown(map, { key: 'ArrowRight' })
    expect(onMove).toHaveBeenCalledWith('right')
  })

  it('does not forward movement into blocked terrain', () => {
    const onMove = vi.fn()
    render(<TileMapViewport document={createMockTileMap()} player={{ x: 1, y: 1 }} onMove={onMove} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'ArrowLeft' })
    expect(onMove).not.toHaveBeenCalled()
  })

  it('forwards interaction intent', () => {
    const onInteract = vi.fn()
    render(<TileMapViewport document={createMockTileMap()} player={{ x: 12, y: 8 }} onInteract={onInteract} />)
    fireEvent.keyDown(screen.getByRole('button'), { key: 'e' })
    expect(onInteract).toHaveBeenCalledOnce()
  })
})
