import type { ITerminalOptions } from '@xterm/xterm'
import type { ReactNode } from 'react'

/** Grid dimensions, in character cells, after the viewport is fitted. */
export type TerminalSize = {
  cols: number
  rows: number
}

/** A chunk of VT/ANSI output. Bytes are decoded by the emulator as UTF-8. */
export type TerminalOutput = string | Uint8Array

/**
 * The seam between tint and whatever is actually producing terminal output —
 * a PTY over a websocket, a worker, a browser runtime.
 *
 * Tint is an emulator, not a shell: it renders what `onOutput` delivers and
 * forwards what the reader types, and never interprets either.
 */
export type TerminalSession = {
  /**
   * Subscribe to output produced by the host runtime. Returns an unsubscribe
   * function, called on unmount and whenever `session` identity changes.
   *
   * A new `session` object resets the emulator, clearing scrollback — so keep
   * it referentially stable (a `useMemo` or a ref) unless a reset is intended.
   */
  onOutput: (listener: (chunk: TerminalOutput) => void) => () => void
  /**
   * Forward raw input, including control sequences, to the host runtime.
   * Only called while `status` is `connected`.
   */
  sendInput: (data: string) => void
  /** Notify the runtime when the fitted grid changes, so the PTY can match it. */
  resize?: (size: TerminalSize) => void
}

export type TerminalStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

export type TerminalConsoleProps = {
  /** Adapter to the host runtime. See the stability note on `onOutput`. */
  session: TerminalSession
  /**
   * Controlled connection state. Anything other than `connected` disables
   * stdin, so keystrokes are dropped rather than sent into a dead socket.
   */
  status: TerminalStatus
  /** Controlled `Panel` disclosure state. Re-fits the grid when it opens. */
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  /** Panel disclosure label. */
  title?: ReactNode
  /** Replaces the status text derived from `status`, and titles the element. */
  statusMessage?: string
  /** Shows a reconnect control while `status` is `disconnected` or `error`. */
  onReconnect?: () => void
  /** Observes a local viewport clear. Tint clears its own buffer regardless. */
  onClear?: () => void
  /** Accessible name for the viewport, which is a `role="application"` region. */
  label?: string
  /**
   * Initial xterm options. Tint owns `theme` (it tracks the active palette) and
   * `disableStdin` (it tracks `status`), so both are excluded.
   *
   * Read **once, on mount**. Later changes are ignored — the terminal is not
   * rebuilt, because doing so would discard scrollback and the cursor. Change
   * the `session` identity if a genuinely fresh terminal is wanted.
   */
  options?: Omit<ITerminalOptions, 'theme' | 'disableStdin'>
  /** Extra classes for the `Panel` root. */
  className?: string
  /**
   * Extra classes for the `Panel` body. Avoid display utilities here —
   * collapsing relies on the `hidden` attribute, which any `display` utility
   * outranks, leaving a "collapsed" terminal fully visible.
   */
  bodyClassName?: string
  /** Extra classes for the terminal viewport. Defaults to a 24rem tall surface. */
  viewportClassName?: string
}
