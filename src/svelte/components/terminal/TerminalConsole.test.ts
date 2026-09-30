import { fireEvent, render, screen, waitFor } from '@testing-library/svelte'
import { describe, expect, it, vi } from 'vitest'
import type { TerminalSession } from '../../../core/terminal/types'

const mocks = vi.hoisted(() => {
  const controllers: MockController[] = []
  class MockController {
    setSession = vi.fn()
    setStatus = vi.fn()
    fit = vi.fn()
    clear = vi.fn()
    dispose = vi.fn()
    constructor() { controllers.push(this) }
  }
  return { controllers, MockController }
})
vi.mock('../../../core/terminal/controller', () => ({ TerminalController: mocks.MockController }))

import TerminalConsole from './TerminalConsole.svelte'

const session = (): TerminalSession => ({ onOutput: () => () => {}, sendInput: () => {} })

describe('Svelte TerminalConsole', () => {
  it('keeps the viewport mounted across controlled state changes and cleans up on unmount', async () => {
    mocks.controllers.length = 0
    const first = session()
    const second = session()
    const onExpandedChange = vi.fn()
    const onReconnect = vi.fn()
    const onClear = vi.fn()
    const props = { session: first, status: 'connected' as const, expanded: true, onExpandedChange, onReconnect, onClear }
    const view = render(TerminalConsole, props)
    const viewport = screen.getByRole('application', { name: 'Interactive terminal' })
    await waitFor(() => expect(mocks.controllers).toHaveLength(1))
    await waitFor(() => expect(mocks.controllers[0]?.fit).toHaveBeenCalled())
    expect(screen.getByText('Connected')).toBeInTheDocument()
    await fireEvent.click(screen.getByRole('button', { name: 'Clear terminal' }))
    expect(mocks.controllers[0]?.clear).toHaveBeenCalledOnce()
    expect(onClear).toHaveBeenCalledOnce()

    await view.rerender({ ...props, session: second, status: 'error' })
    expect(mocks.controllers).toHaveLength(1)
    expect(mocks.controllers[0]?.setSession).toHaveBeenLastCalledWith(second)
    expect(mocks.controllers[0]?.setStatus).toHaveBeenLastCalledWith('error')
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByRole('application', { name: 'Interactive terminal' })).toBe(viewport)
    await fireEvent.click(screen.getByRole('button', { name: 'Reconnect terminal' }))
    expect(onReconnect).toHaveBeenCalledOnce()
    await fireEvent.click(screen.getByRole('button', { name: 'Terminal' }))
    expect(onExpandedChange).toHaveBeenCalledWith(false)
    expect(viewport).toBeInTheDocument()
    view.unmount()
    expect(mocks.controllers[0]?.dispose).toHaveBeenCalledOnce()
  })
})
