export { default as TerminalConsole } from './TerminalConsole.svelte'
export type { TerminalConsoleProps } from './types'
export type { TerminalOutput, TerminalSession, TerminalSize, TerminalStatus, TintTerminalOptions } from '../../../core/terminal'

export { resolveTerminalTheme, observeTerminalTheme } from '../../../core/terminal/theme'
