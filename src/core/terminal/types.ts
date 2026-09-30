/** Grid dimensions, in character cells, after the viewport is fitted. */
export type TerminalSize = { cols: number; rows: number }

/** A chunk of VT/ANSI output. Bytes are decoded by the emulator as UTF-8. */
export type TerminalOutput = string | Uint8Array

/** The seam between Tint's emulator and a host PTY, worker, or browser runtime. */
export type TerminalSession = {
  /** Subscribe to output. Changing session identity resets the emulator. */
  onOutput: (listener: (chunk: TerminalOutput) => void) => () => void
  /** Forward raw input to the runtime while the connection is active. */
  sendInput: (data: string) => void
  /** Keep the runtime PTY in sync with the fitted character grid. */
  resize?: (size: TerminalSize) => void
}

export type TerminalStatus = 'connecting' | 'connected' | 'disconnected' | 'error'
