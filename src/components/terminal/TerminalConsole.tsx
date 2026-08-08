import { FitAddon } from '@xterm/addon-fit'
import { Terminal as XtermTerminal, type ITheme } from '@xterm/xterm'
import { Eraser, RefreshCw, Terminal as TerminalIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Icon, StatusIcon } from '@/components/icon'
import { Panel } from '@/components/panel'
import { cn } from '@/lib/utils'
import type {
  TerminalConsoleProps,
  TerminalSession,
  TerminalStatus,
} from './types'

const STATUS_LABEL: Record<TerminalStatus, string> = {
  connecting: 'Connecting',
  connected: 'Connected',
  disconnected: 'Disconnected',
  error: 'Error',
}

const STATUS_ICON = {
  connecting: 'loading',
  connected: 'success',
  disconnected: 'cancelled',
  error: 'error',
} as const

function resolveColor(host: HTMLElement, token: string, fallback: string) {
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  host.append(probe)
  const value = getComputedStyle(probe).color
  probe.remove()
  return value || fallback
}

function resolveTheme(host: HTMLElement): ITheme {
  return {
    background: resolveColor(host, '--tint-code', '#0f172a'),
    foreground: resolveColor(host, '--tint-code-ink', '#e2e8f0'),
    cursor: resolveColor(host, '--tint-accent', '#4fd1a5'),
    cursorAccent: resolveColor(host, '--tint-code', '#0f172a'),
    selectionBackground: resolveColor(host, '--tint-accent-soft', '#15302a'),
    selectionForeground: resolveColor(host, '--tint-ink', '#e6e9f0'),
    black: resolveColor(host, '--tint-code', '#0f172a'),
    red: resolveColor(host, '--tint-danger', '#f97066'),
    green: resolveColor(host, '--tint-success', '#47cd89'),
    yellow: resolveColor(host, '--tint-warning', '#fdb022'),
    blue: resolveColor(host, '--tint-info', '#6aa9ff'),
    magenta: resolveColor(host, '--tint-accent', '#4fd1a5'),
    cyan: resolveColor(host, '--tint-info-ink', '#9cc6ff'),
    white: resolveColor(host, '--tint-code-ink', '#e2e8f0'),
    brightBlack: resolveColor(host, '--tint-code-muted', '#94a3b8'),
    brightRed: resolveColor(host, '--tint-danger-ink', '#fda29b'),
    brightGreen: resolveColor(host, '--tint-success-ink', '#75e0a7'),
    brightYellow: resolveColor(host, '--tint-warning-ink', '#fec84b'),
    brightBlue: resolveColor(host, '--tint-info-ink', '#9cc6ff'),
    brightMagenta: resolveColor(host, '--tint-accent-hover', '#6fdbb8'),
    brightCyan: resolveColor(host, '--tint-info-ink', '#9cc6ff'),
    brightWhite: resolveColor(host, '--tint-code-ink', '#e2e8f0'),
  }
}

function observeTheme(host: HTMLElement, update: () => void) {
  const observer = new MutationObserver(update)
  let current: HTMLElement | null = host
  while (current) {
    observer.observe(current, {
      attributes: true,
      attributeFilter: ['data-theme', 'data-scheme', 'class', 'style'],
    })
    current = current.parentElement
  }

  const scheme = window.matchMedia?.('(prefers-color-scheme: dark)')
  scheme?.addEventListener('change', update)

  return () => {
    observer.disconnect()
    scheme?.removeEventListener('change', update)
  }
}

function TerminalStatusView({
  status,
  message,
}: {
  status: TerminalStatus
  message?: string
}) {
  const label = STATUS_LABEL[status]
  return (
    <span
      aria-live="polite"
      title={message}
      className="flex min-w-0 items-center gap-1.5"
    >
      <StatusIcon status={STATUS_ICON[status]} size="xs" />
      <span className="truncate">{message || label}</span>
    </span>
  )
}

function HeaderButton({
  label,
  icon,
  onClick,
}: {
  label: string
  icon: typeof Eraser
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md text-tint-muted outline-none transition hover:bg-tint-accent-soft hover:text-tint-ink focus-visible:ring-2 focus-visible:ring-tint-accent"
    >
      <Icon icon={icon} size="sm" />
    </button>
  )
}

export function TerminalConsole({
  session,
  status,
  expanded,
  onExpandedChange,
  title = 'Terminal',
  statusMessage,
  onReconnect,
  onClear,
  label = 'Interactive terminal',
  options,
  className,
  bodyClassName,
  viewportClassName,
}: TerminalConsoleProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const terminalRef = useRef<XtermTerminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const initialOptionsRef = useRef(options)
  const sessionRef = useRef<TerminalSession>(session)
  const statusRef = useRef(status)
  const previousSessionRef = useRef(session)
  sessionRef.current = session
  statusRef.current = status

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const terminal = new XtermTerminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
      fontSize: 13,
      lineHeight: 1.25,
      minimumContrastRatio: 4.5,
      scrollback: 5000,
      screenReaderMode: true,
      ...initialOptionsRef.current,
      theme: resolveTheme(host),
      disableStdin: statusRef.current !== 'connected',
    })
    const fit = new FitAddon()
    terminal.loadAddon(fit)
    terminal.open(host)
    terminalRef.current = terminal
    fitRef.current = fit

    const input = terminal.onData((data) => {
      if (statusRef.current === 'connected') sessionRef.current.sendInput(data)
    })
    const resize = terminal.onResize(({ cols, rows }) => {
      sessionRef.current.resize?.({ cols, rows })
    })

    const fitTerminal = () => {
      if (!host.hidden && host.getClientRects().length) fit.fit()
    }
    const frame = requestAnimationFrame(fitTerminal)
    const resizeObserver = new ResizeObserver(fitTerminal)
    resizeObserver.observe(host)
    const stopThemeObserver = observeTheme(host, () => {
      terminal.options.theme = resolveTheme(host)
    })

    return () => {
      cancelAnimationFrame(frame)
      stopThemeObserver()
      resizeObserver.disconnect()
      input.dispose()
      resize.dispose()
      terminal.dispose()
      terminalRef.current = null
      fitRef.current = null
    }
  }, [])

  useEffect(() => {
    const terminal = terminalRef.current
    if (!terminal) return
    if (previousSessionRef.current !== session) {
      terminal.reset()
      previousSessionRef.current = session
    }
    return session.onOutput((chunk) => terminal.write(chunk))
  }, [session])

  useEffect(() => {
    const terminal = terminalRef.current
    if (terminal) terminal.options.disableStdin = status !== 'connected'
  }, [status])

  useEffect(() => {
    if (!expanded) return
    const frame = requestAnimationFrame(() => fitRef.current?.fit())
    return () => cancelAnimationFrame(frame)
  }, [expanded])

  const clear = () => {
    terminalRef.current?.clear()
    onClear?.()
  }

  const actions = (
    <>
      {(status === 'disconnected' || status === 'error') && onReconnect ? (
        <HeaderButton label="Reconnect terminal" icon={RefreshCw} onClick={onReconnect} />
      ) : null}
      <HeaderButton label="Clear terminal" icon={Eraser} onClick={clear} />
    </>
  )

  return (
    <Panel
      title={title}
      icon={<Icon icon={TerminalIcon} size="sm" />}
      status={<TerminalStatusView status={status} message={statusMessage} />}
      actions={actions}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      className={className}
      bodyClassName={cn('bg-tint-code', bodyClassName)}
    >
      <div
        ref={hostRef}
        role="application"
        aria-label={label}
        data-terminal-viewport=""
        className={cn('h-96 min-h-48 w-full bg-tint-code p-2', viewportClassName)}
      />
    </Panel>
  )
}
