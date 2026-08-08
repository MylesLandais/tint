import type { ITerminalOptions } from '@xterm/xterm'
import type { ReactNode } from 'react'

export type TerminalSize = {
  cols: number
  rows: number
}

export type TerminalOutput = string | Uint8Array

export type TerminalSession = {
  /** Subscribe to VT/ANSI output produced by the host runtime. */
  onOutput: (listener: (chunk: TerminalOutput) => void) => () => void
  /** Forward raw terminal input, including control sequences, to the host runtime. */
  sendInput: (data: string) => void
  /** Notify the runtime when the fitted terminal grid changes. */
  resize?: (size: TerminalSize) => void
}

export type TerminalStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

export type TerminalConsoleProps = {
  session: TerminalSession
  status: TerminalStatus
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  title?: ReactNode
  statusMessage?: string
  onReconnect?: () => void
  onClear?: () => void
  label?: string
  /** Initial xterm options. Tint owns theme and status-driven input state. */
  options?: Omit<ITerminalOptions, 'theme' | 'disableStdin'>
  className?: string
  bodyClassName?: string
  viewportClassName?: string
}
