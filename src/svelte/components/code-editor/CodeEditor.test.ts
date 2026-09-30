import { render } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import type { CollabSession } from '../../../core/collab/types'

const mocks = vi.hoisted(() => {
  const views: { destroy: ReturnType<typeof vi.fn> }[] = []
  const mount = vi.fn(() => {
    const view = { destroy: vi.fn() }
    views.push(view)
    return view
  })
  return { views, mount }
})
vi.mock('../../../core/code-editor', () => ({ mountCodeEditor: mocks.mount }))

import CodeEditor from './CodeEditor.svelte'

describe('Svelte CodeEditor lifecycle', () => {
  it('rebuilds on session or editor option changes and reports view teardown', async () => {
    mocks.views.length = 0
    const first = { fragment: { toString: () => 'first' } } as CollabSession
    const second = { fragment: { toString: () => 'second' } } as CollabSession
    const onView = vi.fn()
    const view = render(CodeEditor, { session: first, readOnly: false, label: 'Code', onView })
    expect(mocks.mount).toHaveBeenCalledWith(expect.any(HTMLElement), { session: first, presence: undefined, readOnly: false, label: 'Code' })
    expect(onView).toHaveBeenCalledWith(mocks.views[0])
    await view.rerender({ session: second, readOnly: true, label: 'Code', onView })
    expect(mocks.views[0]?.destroy).toHaveBeenCalledOnce()
    expect(onView).toHaveBeenCalledWith(null)
    expect(mocks.mount).toHaveBeenLastCalledWith(expect.any(HTMLElement), { session: second, presence: undefined, readOnly: true, label: 'Code' })
    view.unmount()
    expect(mocks.views[1]?.destroy).toHaveBeenCalledOnce()
  })
})
