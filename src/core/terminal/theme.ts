import type { ITheme } from '@xterm/xterm'

function resolveColor(host: HTMLElement, token: string, fallback: string): string {
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  host.append(probe)
  const value = getComputedStyle(probe).color
  probe.remove()
  return value || fallback
}

/** Resolve Tint tokens against the mounted terminal's actual theme ancestry. */
export function resolveTerminalTheme(host: HTMLElement): ITheme {
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

/** Theme changes can occur on any ancestor or through the OS color scheme. */
export function observeTerminalTheme(host: HTMLElement, update: () => void): () => void {
  const observer = new MutationObserver(update)
  let current: HTMLElement | null = host
  while (current) {
    observer.observe(current, { attributes: true, attributeFilter: ['data-theme', 'data-scheme', 'class', 'style'] })
    current = current.parentElement
  }
  const scheme = window.matchMedia?.('(prefers-color-scheme: dark)')
  scheme?.addEventListener('change', update)
  return () => {
    observer.disconnect()
    scheme?.removeEventListener('change', update)
  }
}
