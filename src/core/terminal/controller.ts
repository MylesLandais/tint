import { FitAddon } from '@xterm/addon-fit'
import { Terminal, type ITerminalOptions } from '@xterm/xterm'
import type { TerminalSession, TerminalStatus } from './types'
import { observeTerminalTheme, resolveTerminalTheme } from './theme'

export type TintTerminalOptions = Omit<ITerminalOptions, 'theme' | 'disableStdin'>

/** Owns one xterm viewport while framework components own only its DOM mount. */
export class TerminalController {
  readonly terminal: Terminal
  readonly fitAddon: FitAddon
  private readonly host: HTMLElement
  private session: TerminalSession
  private status: TerminalStatus
  private unsubscribe: (() => void) | null = null
  private readonly input: { dispose: () => void }
  private readonly resize: { dispose: () => void }
  private readonly resizeObserver: ResizeObserver
  private readonly stopThemeObserver: () => void
  private readonly initialFrame: number
  private disposed = false

  constructor(host: HTMLElement, session: TerminalSession, status: TerminalStatus, options?: TintTerminalOptions) {
    this.host = host
    this.session = session
    this.status = status
    this.terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
      fontSize: 13,
      lineHeight: 1.25,
      minimumContrastRatio: 4.5,
      scrollback: 5000,
      screenReaderMode: true,
      ...options,
      theme: resolveTerminalTheme(host),
      disableStdin: status !== 'connected',
    })
    this.fitAddon = new FitAddon()
    this.terminal.loadAddon(this.fitAddon)
    this.terminal.open(host)
    this.input = this.terminal.onData((data) => {
      if (this.status === 'connected') this.session.sendInput(data)
    })
    this.resize = this.terminal.onResize(({ cols, rows }) => {
      this.session.resize?.({ cols, rows })
    })
    this.unsubscribe = session.onOutput((chunk) => this.terminal.write(chunk))
    this.initialFrame = requestAnimationFrame(() => this.fit())
    this.resizeObserver = new ResizeObserver(() => this.fit())
    this.resizeObserver.observe(host)
    this.stopThemeObserver = observeTerminalTheme(host, () => {
      this.terminal.options.theme = resolveTerminalTheme(host)
    })
  }

  setSession(session: TerminalSession): void {
    if (this.disposed || this.session === session) return
    this.unsubscribe?.()
    this.terminal.reset()
    this.session = session
    this.unsubscribe = session.onOutput((chunk) => this.terminal.write(chunk))
  }

  setStatus(status: TerminalStatus): void {
    if (this.disposed || this.status === status) return
    this.status = status
    this.terminal.options.disableStdin = status !== 'connected'
  }

  fit(): void {
    if (!this.disposed && !this.host.hidden && this.host.getClientRects().length) this.fitAddon.fit()
  }

  clear(): void {
    if (!this.disposed) this.terminal.clear()
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    cancelAnimationFrame(this.initialFrame)
    this.unsubscribe?.()
    this.unsubscribe = null
    this.stopThemeObserver()
    this.resizeObserver.disconnect()
    this.input.dispose()
    this.resize.dispose()
    this.terminal.dispose()
  }
}
