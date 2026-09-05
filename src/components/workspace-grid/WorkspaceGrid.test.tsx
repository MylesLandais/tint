import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceGrid } from './WorkspaceGrid'
import type { WorkspaceDocument } from './contracts'

describe('WorkspaceGrid', () => {
  it('emits keyboard move and resize commands from controlled state', () => {
    const document: WorkspaceDocument = { id: 'work', revision: '1', layouts: { lg: [{ id: 'metric', x: 0, y: 0, w: 2, h: 2 }] } }
    const onDocumentChange = vi.fn()
    render(<WorkspaceGrid document={document} breakpoints={{ lg: 0 }} columns={{ lg: 12 }} onDocumentChange={onDocumentChange} renderItem={() => <span>Metric</span>} />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Workspace item metric' }), { key: 'ArrowRight', altKey: true })
    expect(onDocumentChange).toHaveBeenCalledWith(expect.objectContaining({ revision: '2' }), expect.objectContaining({ type: 'move', x: 1 }))
  })
})
