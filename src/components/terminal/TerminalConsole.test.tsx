import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TerminalSession } from './types'

const mocks = vi.hoisted(() => {
  const terminals: MockTerminal[] = []
  const fits: MockFit[] = []

  class MockTerminal {
    options: Record<string, unknown>
    write = vi.fn()
    clear = vi.fn()
    reset = vi.fn()
    dispose = vi.fn()
    private dataListener?: (data: string) => void
    private resizeListener?: (size: { cols: number; rows: number }) => void

    constructor(options: Record<string, unknown>) {
      this.options = options
      terminals.push(this)
    }

    loadAddon() {}
    open() {}
    onData(listener: (data: string) => void) {
      this.dataListener = listener
      return { dispose: vi.fn() }
    }
    onResize(listener: (size: { cols: number; rows: number }) => void) {
      this.resizeListener = listener
      return { dispose: vi.fn() }
    }
    emitData(data: string) {
      this.dataListener?.(data)
    }
    emitResize(cols: number, rows: number) {
      this.resizeListener?.({ cols, rows })
    }
  }

  class MockFit {
    fit = vi.fn()
    constructor() {
      fits.push(this)
    }
  }

  return { terminals, fits, MockTerminal, MockFit }
})

vi.mock('@xterm/xterm', () => ({ Terminal: mocks.MockTerminal }))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: mocks.MockFit }))

import { TerminalConsole } from './TerminalConsole'

function createSession() {
  let output: ((chunk: string | Uint8Array) => void) | undefined
  const unsubscribe = vi.fn()
  const session: TerminalSession = {
    onOutput: vi.fn((listener) => {
      output = listener
      return unsubscribe
    }),
    sendInput: vi.fn(),
    resize: vi.fn(),
  }
  return { session, emit: (chunk: string | Uint8Array) => output?.(chunk), unsubscribe }
}

describe('TerminalConsole', () => {
  beforeEach(() => {
    mocks.terminals.length = 0
    mocks.fits.length = 0
  })

  it('bridges runtime output, raw input, and fitted dimensions', async () => {
    const runtime = createSession()
    render(
      <TerminalConsole
        session={runtime.session}
        status="connected"
        expanded
        onExpandedChange={() => {}}
      />,
    )

    expect(screen.getByRole('application', { name: 'Interactive terminal' })).toBeInTheDocument()
    const terminal = mocks.terminals[0]!

    runtime.emit('\x1b[32mok\x1b[0m')
    expect(terminal.write).toHaveBeenCalledWith('\x1b[32mok\x1b[0m')

    terminal.emitData('ls\r')
    expect(runtime.session.sendInput).toHaveBeenCalledWith('ls\r')

    terminal.emitResize(100, 30)
    expect(runtime.session.resize).toHaveBeenCalledWith({ cols: 100, rows: 30 })
    await waitFor(() => expect(mocks.fits[0]?.fit).toHaveBeenCalled())
  })

  it('blocks input while disconnected and offers reconnect', () => {
    const runtime = createSession()
    const onReconnect = vi.fn()
    render(
      <TerminalConsole
        session={runtime.session}
        status="disconnected"
        expanded
        onExpandedChange={() => {}}
        onReconnect={onReconnect}
      />,
    )

    mocks.terminals[0]?.emitData('ignored')
    expect(runtime.session.sendInput).not.toHaveBeenCalled()
    expect(mocks.terminals[0]?.options.disableStdin).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Reconnect terminal' }))
    expect(onReconnect).toHaveBeenCalledOnce()
  })

  it('clears and resubscribes when the session object changes', () => {
    const first = createSession()
    const second = createSession()
    const onClear = vi.fn()
    const { rerender } = render(
      <TerminalConsole
        session={first.session}
        status="connected"
        expanded
        onExpandedChange={() => {}}
        onClear={onClear}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Clear terminal' }))
    expect(mocks.terminals[0]?.clear).toHaveBeenCalledOnce()
    expect(onClear).toHaveBeenCalledOnce()

    rerender(
      <TerminalConsole
        session={second.session}
        status="connected"
        expanded
        onExpandedChange={() => {}}
        onClear={onClear}
      />,
    )

    expect(first.unsubscribe).toHaveBeenCalledOnce()
    expect(mocks.terminals[0]?.reset).toHaveBeenCalledOnce()
    second.emit('new session')
    expect(mocks.terminals[0]?.write).toHaveBeenCalledWith('new session')
  })

  it('preserves the viewport when only connection status changes', () => {
    const runtime = createSession()
    const { rerender } = render(
      <TerminalConsole
        session={runtime.session}
        status="disconnected"
        expanded
        onExpandedChange={() => {}}
      />,
    )

    rerender(
      <TerminalConsole
        session={runtime.session}
        status="connected"
        expanded
        onExpandedChange={() => {}}
      />,
    )

    expect(mocks.terminals[0]?.reset).not.toHaveBeenCalled()
    expect(mocks.terminals[0]?.options.disableStdin).toBe(false)
  })
})
