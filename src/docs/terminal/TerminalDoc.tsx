import { useEffect, useMemo, useRef, useState } from 'react'
import { TerminalConsole, type TerminalOutput, type TerminalSession, type TerminalStatus } from '@/components/terminal'
import { CodeBlock } from '../components/CodeBlock'
import { DocsNav } from '../components/DocsNav'
import { PropsTable } from '../components/PropsTable'

class DemoTerminalSession implements TerminalSession {
  private listeners = new Set<(chunk: TerminalOutput) => void>()
  private line = ''
  private history: string[] = []
  private historyIndex = 0

  onOutput = (listener: (chunk: TerminalOutput) => void) => {
    this.listeners.add(listener)
    listener('\x1b[1;32mTint mock PTY\x1b[0m — type \x1b[1mhelp\x1b[0m for commands.\r\n\r\n')
    this.prompt(listener)
    return () => this.listeners.delete(listener)
  }

  sendInput = (data: string) => {
    if (data === '\x1b[A') {
      if (!this.history.length) return
      this.historyIndex = Math.max(0, this.historyIndex - 1)
      this.replaceLine(this.history[this.historyIndex] ?? '')
      return
    }
    if (data === '\x1b[B') {
      this.historyIndex = Math.min(this.history.length, this.historyIndex + 1)
      this.replaceLine(this.history[this.historyIndex] ?? '')
      return
    }

    for (const character of data) {
      if (character === '\r') {
        this.emit('\r\n')
        this.execute(this.line)
        if (this.line.trim()) this.history.push(this.line)
        this.historyIndex = this.history.length
        this.line = ''
        this.prompt()
      } else if (character === '\u007f') {
        if (this.line) {
          this.line = this.line.slice(0, -1)
          this.emit('\b \b')
        }
      } else if (character === '\u0003') {
        this.emit('^C\r\n')
        this.line = ''
        this.prompt()
      } else if (character === '\u000c') {
        this.emit('\x1b[2J\x1b[H')
        this.prompt()
      } else if (character >= ' ') {
        this.line += character
        this.emit(character)
      }
    }
  }

  resize = (_size: { cols: number; rows: number }) => {}

  reconnect() {
    this.emit('\r\n\x1b[32mSession reconnected.\x1b[0m\r\n')
    this.prompt()
  }

  private emit(chunk: string) {
    for (const listener of this.listeners) listener(chunk)
  }

  private prompt(listener?: (chunk: TerminalOutput) => void) {
    const output = '\x1b[36mvisitor@tint\x1b[0m:\x1b[34m~/workspace\x1b[0m$ '
    if (listener) listener(output)
    else this.emit(output)
  }

  private replaceLine(next: string) {
    this.emit(`\r\x1b[2K`)
    this.line = next
    this.prompt()
    this.emit(next)
  }

  private execute(input: string) {
    const [command, ...args] = input.trim().split(/\s+/)
    switch (command) {
      case '':
        break
      case 'help':
        this.emit('help        List available commands\r\n')
        this.emit('echo TEXT   Print text\r\n')
        this.emit('pwd         Print the working directory\r\n')
        this.emit('whoami      Print the demo user\r\n')
        this.emit('clear       Clear the viewport\r\n')
        break
      case 'echo':
        this.emit(`${args.join(' ')}\r\n`)
        break
      case 'pwd':
        this.emit('/home/visitor/workspace\r\n')
        break
      case 'whoami':
        this.emit('visitor\r\n')
        break
      case 'clear':
        this.emit('\x1b[2J\x1b[H')
        break
      default:
        this.emit(`\x1b[31m${command}: command not found\x1b[0m\r\n`)
    }
  }
}

const usageCode = `import { TerminalConsole, type TerminalSession } from 'tint/terminal'

const session: TerminalSession = {
  onOutput(listener) {
    const onMessage = (event: MessageEvent<string>) => listener(event.data)
    socket.addEventListener('message', onMessage)
    return () => socket.removeEventListener('message', onMessage)
  },
  sendInput(data) {
    socket.send(data)
  },
  resize({ cols, rows }) {
    socket.send(JSON.stringify({ type: 'resize', cols, rows }))
  },
}

<TerminalConsole
  session={session}
  status="connected"
  expanded={expanded}
  onExpandedChange={setExpanded}
/>`

const terminalProps = [
  { name: 'session', type: 'TerminalSession', required: true, description: 'Consumer-owned raw input/output/resize adapter.' },
  { name: 'status', type: "'connecting' | 'connected' | 'disconnected' | 'error'", required: true, description: 'Controlled runtime connection state.' },
  { name: 'expanded', type: 'boolean', required: true, description: 'Controlled Panel disclosure state.' },
  { name: 'onExpandedChange', type: '(expanded: boolean) => void', required: true, description: 'Reports disclosure intent.' },
  { name: 'onReconnect', type: '() => void', description: 'Shows a reconnect action while disconnected or errored.' },
  { name: 'onClear', type: '() => void', description: 'Observes a local viewport clear.' },
  { name: 'options', type: 'Terminal options', description: 'Initial xterm options except theme and disableStdin.' },
]

const panelProps = [
  { name: 'title', type: 'ReactNode', required: true, description: 'Always-visible disclosure label.' },
  { name: 'expanded', type: 'boolean', required: true, description: 'Controlled visibility state; collapsed content remains mounted.' },
  { name: 'onExpandedChange', type: '(expanded: boolean) => void', required: true, description: 'Reports disclosure intent.' },
  { name: 'icon', type: 'ReactNode', description: 'Decorative content before the title.' },
  { name: 'status', type: 'ReactNode', description: 'State content between the disclosure and actions.' },
  { name: 'actions', type: 'ReactNode', description: 'Header controls that do not toggle the disclosure.' },
]

export function TerminalDoc() {
  const session = useMemo(() => new DemoTerminalSession(), [])
  const [status, setStatus] = useState<TerminalStatus>('connected')
  const [expanded, setExpanded] = useState(true)
  const reconnectTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(reconnectTimer.current), [])

  const reconnect = () => {
    setStatus('connecting')
    window.clearTimeout(reconnectTimer.current)
    reconnectTimer.current = window.setTimeout(() => {
      setStatus('connected')
      session.reconnect()
    }, 700)
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="mx-auto max-w-[1200px]">
        <DocsNav current="components/terminal" />

        <section className="mb-8 max-w-3xl">
          <p className="m-0 text-xs font-semibold tracking-[0.14em] text-tint-accent uppercase">Interactive runtime</p>
          <h1 className="mt-2 mb-3 text-3xl font-semibold tracking-tight text-tint-ink sm:text-4xl">TerminalConsole</h1>
          <p className="m-0 text-base leading-7 text-tint-muted">
            A full browser terminal emulator. Tint renders VT output and forwards raw input;
            your application owns the shell, process, and transport.
          </p>
        </section>

        <section className="mb-14">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-tint-warning-soft px-2.5 py-1 text-xs text-tint-warning-ink">Mock PTY — no real shell</span>
            <button
              type="button"
              disabled={status !== 'connected'}
              onClick={() => setStatus('disconnected')}
              className="rounded-md border border-tint-border px-2.5 py-1 text-xs text-tint-muted hover:bg-tint-surface disabled:opacity-40"
            >
              Simulate disconnect
            </button>
          </div>
          <TerminalConsole
            session={session}
            status={status}
            statusMessage={status === 'error' ? 'Runtime failed' : undefined}
            expanded={expanded}
            onExpandedChange={setExpanded}
            onReconnect={reconnect}
            options={{ fontSize: 14 }}
          />
        </section>

        <section id="usage" className="mb-14 max-w-3xl scroll-mt-24">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight text-tint-ink">Usage</h2>
          <CodeBlock code={usageCode} language="tsx" />
        </section>

        <section id="api" className="scroll-mt-24">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight text-tint-ink">API</h2>
          <p className="mb-6 max-w-2xl text-tint-muted">Required props are marked with an asterisk.</p>
          <h3 className="mb-3 text-lg font-semibold text-tint-ink">TerminalConsole</h3>
          <PropsTable rows={terminalProps} />
          <h3 className="mt-10 mb-3 text-lg font-semibold text-tint-ink">Panel</h3>
          <PropsTable rows={panelProps} />
        </section>
      </div>
    </main>
  )
}
