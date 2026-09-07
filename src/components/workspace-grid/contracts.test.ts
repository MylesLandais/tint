import { describe, expect, it } from 'vitest'
import { applyWorkspaceCommand, type WorkspaceDocument } from './contracts'

const document: WorkspaceDocument = { id: 'work', revision: '1', layouts: { lg: [{ id: 'a', x: 0, y: 0, w: 2, h: 2 }, { id: 'b', x: 3, y: 0, w: 2, h: 2, minW: 2 }] } }

describe('applyWorkspaceCommand', () => {
  it('moves and resizes immutably while advancing the revision', () => {
    const moved = applyWorkspaceCommand(document, { type: 'move', breakpoint: 'lg', itemId: 'a', x: 5, y: 2, baseRevision: '1' }, { columns: { lg: 6 } })
    expect(moved.layouts.lg?.[0]).toMatchObject({ x: 4, y: 2 })
    expect(moved.revision).toBe('2')
    expect(document.layouts.lg?.[0]).toMatchObject({ x: 0, y: 0 })
    const resized = applyWorkspaceCommand(moved, { type: 'resize', breakpoint: 'lg', itemId: 'b', w: 1, h: 1, baseRevision: '2' })
    expect(resized.layouts.lg?.[1]).toMatchObject({ w: 2, h: 1 })
  })

  it('rejects stale revisions and prevented collisions', () => {
    expect(applyWorkspaceCommand(document, { type: 'move', breakpoint: 'lg', itemId: 'a', x: 1, y: 0, baseRevision: 'old' })).toBe(document)
    expect(applyWorkspaceCommand(document, { type: 'move', breakpoint: 'lg', itemId: 'a', x: 3, y: 0 }, { collisionMode: 'prevent' })).toBe(document)
  })

  it('reorders without changing geometry', () => {
    const reordered = applyWorkspaceCommand(document, { type: 'reorder', breakpoint: 'lg', itemId: 'b', beforeId: 'a' })
    expect(reordered.layouts.lg?.map((item) => item.id)).toEqual(['b', 'a'])
  })
})
