import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TerminalSession, TerminalOutput } from './types'

const mocks = vi.hoisted(() => {
  const terminals: MockTerminal[] = []
  const fits: MockFit[] = []
  class MockTerminal {
    options: Record<string, unknown>
    write = vi.fn()
    clear = vi.fn()
    reset = vi.fn()
    dispose = vi.fn()
    inputDispose = vi.fn()
    resizeDispose = vi.fn()
    private dataListener?: (data: string) => void
    private resizeListener?: (size: { cols: number; rows: number }) => void
    constructor(options: Record<string, unknown>) { this.options = options; terminals.push(this) }
    loadAddon() {}
    open() {}
    onData(listener: (data: string) => void) { this.dataListener = listener; return { dispose: this.inputDispose } }
    onResize(listener: (size: { cols: number; rows: number }) => void) { this.resizeListener = listener; return { dispose: this.resizeDispose } }
    emitData(data: string) { this.dataListener?.(data) }
    emitResize(cols: number, rows: number) { this.resizeListener?.({ cols, rows }) }
  }
  class MockFit { fit = vi.fn(); constructor() { fits.push(this) } }
  return { terminals, fits, MockTerminal, MockFit }
})

vi.mock('@xterm/xterm', () => ({ Terminal: mocks.MockTerminal }))
vi.mock('@xterm/addon-fit', () => ({ FitAddon: mocks.MockFit }))

import { TerminalController } from './controller'

function createSession() {
  let output: ((chunk: TerminalOutput) => void) | undefined
  const unsubscribe = vi.fn()
  const session: TerminalSession = {
    onOutput: vi.fn((listener) => { output = listener; return unsubscribe }),
    sendInput: vi.fn(),
    resize: vi.fn(),
  }
  return { session, emit: (chunk: TerminalOutput) => output?.(chunk), unsubscribe }
}

describe('TerminalController', () => {
  beforeEach(() => { mocks.terminals.length = 0; mocks.fits.length = 0 })

  it('bridges output, guarded input, resize, and status without discarding scrollback', () => {
    const host = document.createElement('div')
    const runtime = createSession()
    const controller = new TerminalController(host, runtime.session, 'connected', { fontSize: 15 })
    const terminal = mocks.terminals[0]!
    expect(terminal.options.fontSize).toBe(15)
    expect(terminal.options.disableStdin).toBe(false)
    runtime.emit('\x1b[32mok\x1b[0m')
    expect(terminal.write).toHaveBeenCalledWith('\x1b[32mok\x1b[0m')
    terminal.emitData('ls\r')
    terminal.emitResize(100, 30)
    expect(runtime.session.sendInput).toHaveBeenCalledWith('ls\r')
    expect(runtime.session.resize).toHaveBeenCalledWith({ cols: 100, rows: 30 })

    controller.setStatus('disconnected')
    terminal.emitData('ignored')
    expect(runtime.session.sendInput).toHaveBeenCalledTimes(1)
    expect(terminal.options.disableStdin).toBe(true)
    controller.setStatus('connected')
    expect(terminal.options.disableStdin).toBe(false)
    expect(terminal.reset).not.toHaveBeenCalled()
    controller.dispose()
  })

  it('unsubscribes and resets only for a new session, then disposes every owned resource', () => {
    const host = document.createElement('div')
    vi.spyOn(host, 'getClientRects').mockReturnValue({ length: 1 } as DOMRectList)
    const first = createSession()
    const second = createSession()
    const controller = new TerminalController(host, first.session, 'connected')
    const terminal = mocks.terminals[0]!
    controller.setSession(first.session)
    expect(terminal.reset).not.toHaveBeenCalled()
    controller.setSession(second.session)
    expect(first.unsubscribe).toHaveBeenCalledOnce()
    expect(terminal.reset).toHaveBeenCalledOnce()
    second.emit(new Uint8Array([65]))
    expect(terminal.write).toHaveBeenCalledWith(new Uint8Array([65]))
    terminal.emitData('pwd\r')
    expect(second.session.sendInput).toHaveBeenCalledWith('pwd\r')
    controller.fit()
    expect(mocks.fits[0]?.fit).toHaveBeenCalledOnce()
    controller.clear()
    expect(terminal.clear).toHaveBeenCalledOnce()
    controller.dispose()
    controller.dispose()
    expect(second.unsubscribe).toHaveBeenCalledOnce()
    expect(terminal.inputDispose).toHaveBeenCalledOnce()
    expect(terminal.resizeDispose).toHaveBeenCalledOnce()
    expect(terminal.dispose).toHaveBeenCalledOnce()
  })

  it('re-resolves its palette when an ancestor theme changes', async () => {
    const ancestor = document.createElement('div')
    const host = document.createElement('div')
    ancestor.append(host)
    document.body.append(ancestor)
    const controller = new TerminalController(host, createSession().session, 'connected')
    const terminal = mocks.terminals[0]!
    const initialTheme = terminal.options.theme
    ancestor.dataset.theme = 'macchiato'
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(terminal.options.theme).not.toBe(initialTheme)
    controller.dispose()
    ancestor.remove()
  })
})
