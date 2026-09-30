import type { TerminalSession, TerminalStatus, TintTerminalOptions } from '../../../core/terminal'

export type TerminalConsoleProps = {
  session: TerminalSession
  status: TerminalStatus
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  title?: string
  statusMessage?: string
  onReconnect?: () => void
  onClear?: () => void
  label?: string
  /** Read once on mount. Change the session identity to reset the viewport. */
  options?: TintTerminalOptions
  class?: string
  bodyClassName?: string
  viewportClassName?: string
}
